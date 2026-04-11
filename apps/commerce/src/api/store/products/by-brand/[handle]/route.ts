import type { MedusaRequest, MedusaResponse, MedusaStoreRequest } from '@medusajs/framework/http'
import { refetchEntity } from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
  QueryContext,
} from '@medusajs/framework/utils'
import {
  filterOutInternalProductCategories,
  wrapProductsWithTaxPrices,
} from '@medusajs/medusa/api/store/products/helpers'
import { wrapVariantsWithTotalInventoryQuantity } from '@medusajs/medusa/api/utils/middlewares/products/variant-inventory-quantity'

/**
 * GET /store/products/by-brand/:handle
 *
 * 1) Resolve product ids via `brand → products` (same discovery as the original route — reliable).
 * 2) Load those products with `query.graph` using published + sales-channel + pricing context
 *    (parity with GET /store/products), so variants get `calculated_price`.
 *
 * Filtering products only with `brand: { handle }` on the product entity returned **empty** results
 * in some deployments (graph vs index / filter shape), while the brand graph still lists links.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const handle = req.params.handle as string | undefined
  if (!handle) {
    return res.status(400).json({ message: 'Brand handle required' })
  }

  const storeReq = req as MedusaStoreRequest
  const salesChannelIds = storeReq.publishable_key_context?.sales_channel_ids ?? []
  if (salesChannelIds.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Publishable key needs to have a sales channel configured',
    )
  }

  const regionId =
    typeof req.query.region_id === 'string' && req.query.region_id.length > 0
      ? req.query.region_id
      : undefined

  const orderParam =
    typeof req.query.order === 'string' && req.query.order.length > 0
      ? req.query.order
      : undefined

  const limitRaw = req.query.limit
  const limit =
    typeof limitRaw === 'string'
      ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 100)
      : 50

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: brands = [] } = await query.graph(
    {
      entity: 'brand',
      fields: ['id', 'products.id'],
      filters: { handle },
    },
    { cache: { enable: true } },
  )

  const brand = brands[0] as { products?: Array<{ id?: string }> } | undefined
  const productIds = (brand?.products ?? [])
    .map((p) => p.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  if (productIds.length === 0) {
    return res.json({ products: [], count: 0 })
  }

  const context: {
    variants?: { calculated_price: ReturnType<typeof QueryContext> }
  } = {}

  if (regionId) {
    const region = await refetchEntity({
      entity: 'region',
      idOrFilter: regionId,
      scope: req.scope,
      fields: ['id', 'currency_code'],
      options: {
        cache: {
          enable: true,
        },
      },
    })
    if (!region) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Region with id ${regionId} not found when populating the pricing context`,
      )
    }
    context.variants = {
      calculated_price: QueryContext({
        region_id: region.id,
        currency_code: region.currency_code,
      }),
    }
  }

  const filters: Record<string, unknown> = {
    id: { $in: productIds },
    status: ProductStatus.PUBLISHED,
    sales_channels: { id: salesChannelIds },
  }

  const pagination: {
    skip: number
    take: number
    order?: Record<string, string>
  } = {
    skip: 0,
    take: limit,
  }

  if (orderParam) {
    const colon = orderParam.lastIndexOf(':')
    if (colon > 0) {
      const field = orderParam.slice(0, colon)
      const dir = orderParam.slice(colon + 1)
      if (field && dir) {
        pagination.order = { [field]: dir }
      }
    }
  }

  const fields = [
    'id',
    'handle',
    'title',
    'subtitle',
    'metadata',
    'thumbnail',
    '*images',
    '*variants',
    '*brand',
  ]

  const { data: products = [], metadata } = await query.graph(
    {
      entity: 'product',
      fields,
      filters,
      pagination,
      context,
    },
    {
      cache: {
        enable: true,
      },
    },
  )

  filterOutInternalProductCategories(products as Parameters<typeof filterOutInternalProductCategories>[0])

  const flatVariants = products
    .flatMap((p: { variants?: Array<{ id?: string }> }) => p.variants ?? [])
    .filter((v): v is { id: string } => typeof v.id === 'string')
  await wrapVariantsWithTotalInventoryQuantity(req, flatVariants)
  await wrapProductsWithTaxPrices(
    storeReq,
    products as Parameters<typeof wrapProductsWithTaxPrices>[1],
  )

  res.json({
    products,
    count: metadata?.count ?? products.length,
  })
}
