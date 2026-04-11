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
 * Same pricing & sales-channel behaviour as GET /store/products (category PLP), but filtered by
 * linked brand handle. The previous implementation loaded products via `brand → products` graph
 * without `QueryContext` for `variants.calculated_price`, so storefront showed 0 kr.
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
    status: ProductStatus.PUBLISHED,
    brand: { handle },
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
