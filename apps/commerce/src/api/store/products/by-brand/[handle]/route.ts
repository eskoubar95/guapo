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
import { wrapVariantsWithInventoryQuantityForSalesChannel } from '@medusajs/medusa/api/utils/middlewares/products/variant-inventory-quantity'

/**
 * Store product list fields aligned with storefront PLP (`medusa-products`).
 */
const STORE_BRAND_PLP_FIELDS = [
  'id',
  'handle',
  'title',
  'subtitle',
  'metadata',
  'thumbnail',
  '*images',
  '*variants',
  '*variants.options',
  '+variants.inventory_quantity',
  '+variants.manage_inventory',
  '*brand',
]

/**
 * GET /store/products/by-brand/:handle
 *
 * **Why not `filters: { brand: { handle } }` on `product`?** Medusa’s own docs note that
 * filtering by *linked* models via `query.graph` is limited; the index engine path also
 * diverges from graph. That produced **empty lists** in production while the brand still exists.
 *
 * **Stable approach** (documented for `query.graph`):
 * 1. Load the brand and **linked product ids** (`brand → products.id`) — same discovery as the
 *    original pre-pricing route, which did return rows.
 * 2. Load `product` rows with **native** filters: `id: [ ... ]` (see Query “Apply filters”),
 *    plus `status`, `sales_channel_id`, and `variants.calculated_price` via {@link QueryContext}.
 *
 * Caching is disabled for these queries so empty/stale responses are not sticky during rollout.
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

  const { data: brandRows = [] } = await query.graph(
    {
      entity: 'brand',
      fields: ['id', 'handle', 'products.id'],
      filters: { handle },
    },
    { cache: { enable: false } },
  )

  const brand = brandRows[0] as { products?: Array<{ id?: string }> } | undefined
  const productIds = (brand?.products ?? [])
    .map((p) => p.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  if (productIds.length === 0) {
    return res.json({ products: [], count: 0 })
  }

  let fields = [...STORE_BRAND_PLP_FIELDS]
  const withInventoryQuantity = fields.some((field) => field.includes('variants.inventory_quantity'))
  if (withInventoryQuantity) {
    fields = fields.filter((field) => !field.includes('variants.inventory_quantity'))
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
    const pricingContext = {
      region_id: region.id,
      currency_code: region.currency_code,
    }
    storeReq.pricingContext = pricingContext
    context.variants = {
      calculated_price: QueryContext(pricingContext),
    }
  }

  storeReq.validatedQuery = {
    ...(storeReq.validatedQuery ?? {}),
    region_id: regionId,
    sales_channel_id: salesChannelIds,
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

  /**
   * Native `id` array filter — supported by `query.graph` (Query docs).
   * Same sales-channel shape as GET /store/products (`sales_channel_id` on graph path).
   */
  const productFilters: Record<string, unknown> = {
    id: productIds,
    status: ProductStatus.PUBLISHED,
    sales_channel_id: salesChannelIds,
  }

  const { data: products = [], metadata } = await query.graph(
    {
      entity: 'product',
      fields,
      filters: productFilters,
      pagination,
      context,
    },
    {
      cache: { enable: false },
      locale: req.locale,
    },
  )

  filterOutInternalProductCategories(products as Parameters<typeof filterOutInternalProductCategories>[0])

  if (withInventoryQuantity) {
    const variantRows = (products as Array<{ variants?: Array<{ id: string }> }>).flatMap(
      (p) => p.variants ?? [],
    )
    await wrapVariantsWithInventoryQuantityForSalesChannel(storeReq, variantRows)
  }

  await wrapProductsWithTaxPrices(
    storeReq,
    products as Parameters<typeof wrapProductsWithTaxPrices>[1],
  )

  res.json({
    products,
    count: metadata?.count ?? products.length,
  })
}
