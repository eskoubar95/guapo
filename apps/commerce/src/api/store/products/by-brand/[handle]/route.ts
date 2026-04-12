import type { MedusaRequest, MedusaResponse, MedusaStoreRequest } from '@medusajs/framework/http'
import { refetchEntity } from '@medusajs/framework/http'
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
  QueryContext,
} from '@medusajs/framework/utils'
import ProductBrandLink from '../../../../../links/product-brand'
import {
  filterOutInternalProductCategories,
  wrapProductsWithTaxPrices,
} from '@medusajs/medusa/api/store/products/helpers'

/**
 * PLP fields for storefront mapping (`medusa-products`).
 *
 * **No** `+variants.inventory_quantity` / inventory wrapper: Medusa’s
 * `wrapVariantsWithInventoryQuantityForSalesChannel` throws when the publishable key has multiple
 * sales channels unless the request matches core `/store/products` middleware shape exactly.
 * Category PLP uses the core route (full middleware stack); this custom route avoids that path.
 * Stock on PLP cards falls back to “available” when `manage_inventory` is omitted (see storefront
 * `getVariantStockInfo`).
 */
/**
 * `query.graph` field paths differ from Store API comma-fields (`*variants` works there only after
 * middleware transforms). For Remote Query use `relation.*` (see Medusa “Field selection”).
 */
const STORE_BRAND_PLP_FIELDS = [
  'id',
  'handle',
  'title',
  'subtitle',
  'metadata',
  'thumbnail',
  'images.*',
  'variants.*',
  'variants.options.*',
  '+variants.calculated_price',
  'brand.*',
]

const getProductBrandLinkEntity = () => {
  const entryPoint = (ProductBrandLink as { entryPoint?: string }).entryPoint
  if (typeof entryPoint === 'string' && entryPoint.length > 0) {
    return entryPoint
  }
  return 'product_brand'
}

/**
 * GET /store/products/by-brand/:handle
 *
 * Mirrors how core `GET /store/products` applies **sales channels**:
 * - With **more than one** sales channel in the DB, filtering is done via the
 *   **`product_sales_channel` link** (see `maybeApplyLinkFilter` in Medusa), not by passing
 *   `sales_channel_id` on the `product` graph filter (that pattern does not match the core list route).
 * - With **at most one** channel, the store list **drops** the sales-channel filter (same as core middleware).
 *
 * Brand → product ids: link entity (`ProductBrandLink.entryPoint`) with `brand_id`, then fallback `brand.products.id`.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const handle = req.params.handle as string | undefined
  if (!handle) {
    return res.status(400).json({ message: 'Brand handle required' })
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
    warn: (msg: string) => void
    error: (msg: string) => void
  }

  try {
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
        fields: ['id', 'handle'],
        filters: { handle },
      },
      { cache: { enable: false } },
    )

    const brand = brandRows[0] as { id?: string } | undefined
    if (!brand?.id) {
      return res.json({ products: [], count: 0 })
    }

    let productIds: string[] = []
    try {
      const { data: brandLinkRows = [] } = await query.graph(
        {
          entity: getProductBrandLinkEntity(),
          fields: ['product_id'],
          filters: { brand_id: brand.id },
          pagination: { skip: 0, take: 5000 },
        },
        { cache: { enable: false } },
      )
      productIds = [
        ...new Set(
          brandLinkRows
            .map((row: { product_id?: string }) => row.product_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      ]
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      logger.warn(`[store/by-brand] Link query failed for brand ${brand.id}: ${message}`)
    }

    if (productIds.length === 0) {
      const { data: brandWithProducts = [] } = await query.graph(
        {
          entity: 'brand',
          fields: ['id', 'products.id'],
          filters: { id: brand.id },
        },
        { cache: { enable: false } },
      )
      const fallbackProducts =
        (brandWithProducts[0] as { products?: Array<{ id?: string }> } | undefined)?.products ?? []
      productIds = [
        ...new Set(
          fallbackProducts
            .map((p) => p.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      ]
    }

    if (productIds.length === 0) {
      return res.json({ products: [], count: 0 })
    }

    const salesChannelsQueryRes = await query.graph(
      {
        entity: 'sales_channels',
        fields: ['id'],
        pagination: { skip: 0, take: 1 },
      },
      { cache: { enable: false } },
    )
    const salesChannelCount = salesChannelsQueryRes.metadata?.count ?? 0

    if (salesChannelCount > 1) {
      const { data: linkRows = [] } = await query.graph(
        {
          entity: 'product_sales_channel',
          fields: ['product_id'],
          filters: {
            sales_channel_id: salesChannelIds,
            product_id: productIds,
          },
        },
        { cache: { enable: false } },
      )
      productIds = [
        ...new Set(
          linkRows
            .map((row: { product_id?: string }) => row.product_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      ]
      if (productIds.length === 0) {
        return res.json({ products: [], count: 0 })
      }
    }

    let fields = [...STORE_BRAND_PLP_FIELDS]
    if (!regionId) {
      fields = fields.filter((f) => !f.includes('calculated_price'))
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

    const productFilters: Record<string, unknown> = {
      id: productIds,
      status: ProductStatus.PUBLISHED,
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

    await wrapProductsWithTaxPrices(
      storeReq,
      products as Parameters<typeof wrapProductsWithTaxPrices>[1],
    )

    return res.json({
      products,
      count: metadata?.count ?? products.length,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    logger.error(`[store/by-brand] handle=${handle}: ${message}`)
    return res.status(500).json({
      code: 'by_brand_error',
      type: 'by_brand_error',
      message,
    })
  }
}
