import type { MedusaRequest, MedusaResponse, MedusaStoreRequest } from '@medusajs/framework/http'
import { refetchEntity } from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  isPresent,
  MedusaError,
  ProductStatus,
  QueryContext,
} from '@medusajs/framework/utils'
import IndexEngineFeatureFlag from '@medusajs/medusa/feature-flags/index-engine'
import {
  filterOutInternalProductCategories,
  wrapProductsWithTaxPrices,
} from '@medusajs/medusa/api/store/products/helpers'
import { wrapVariantsWithInventoryQuantityForSalesChannel } from '@medusajs/medusa/api/utils/middlewares/products/variant-inventory-quantity'

/**
 * Store product list fields aligned with storefront PLP (`medusa-products`); inventory is applied
 * after query via {@link wrapVariantsWithInventoryQuantityForSalesChannel} like GET /store/products.
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
 * Mirrors core {@link https://github.com/medusajs/medusa/blob/develop/packages/medusa/src/api/store/products/route.ts GET /store/products}:
 * - Same **index engine vs graph** branch (`MEDUSA_FF_INDEX_ENGINE` / FeatureFlag).
 * - **Graph** path: `filters` use `sales_channel_id` (not `sales_channels`) — see `getProducts()`.
 * - **Index** path: `sales_channel_id` → `sales_channels.id` — see `getProductsWithIndexEngine()`.
 * - Pricing: `QueryContext` on `variants.calculated_price` from `region_id` (same as `setPricingContext` middleware).
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

  const baseFilters: Record<string, unknown> = {
    status: ProductStatus.PUBLISHED,
    brand: { handle },
    sales_channel_id: salesChannelIds,
  }

  const queryOptions = {
    cache: {
      enable: true,
    },
    locale: req.locale,
  }

  const useIndexEngine = FeatureFlag.isFeatureEnabled(IndexEngineFeatureFlag.key)

  let products: unknown[] = []
  let count = 0

  if (useIndexEngine) {
    const filters = { ...baseFilters }
    if (isPresent(filters.sales_channel_id)) {
      const sc = filters.sales_channel_id as string[]
      filters.sales_channels ??= {}
      ;(filters.sales_channels as Record<string, unknown>).id = sc
      delete filters.sales_channel_id
    }
    const result = await query.index(
      {
        entity: 'product',
        fields,
        filters,
        pagination,
        context,
      },
      queryOptions,
    )
    products = result.data ?? []
    count = result.metadata?.estimate_count ?? products.length
  } else {
    const result = await query.graph(
      {
        entity: 'product',
        fields,
        filters: baseFilters,
        pagination,
        context,
      },
      queryOptions,
    )
    products = result.data ?? []
    count = result.metadata?.count ?? products.length
  }

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
    count,
  })
}
