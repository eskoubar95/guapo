import type { MedusaRequest, MedusaResponse, MedusaStoreRequest } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import ProductBrandLink from '../../../../../../links/product-brand'

const getProductBrandLinkEntity = () => {
  const entryPoint = (ProductBrandLink as { entryPoint?: string }).entryPoint
  if (typeof entryPoint === 'string' && entryPoint.length > 0) {
    return entryPoint
  }
  return 'product_brand'
}

/**
 * GET /store/products/by-brand/:handle/product-ids
 *
 * Returns Medusa product ids linked to the brand (published + sales-channel rules match PLP).
 * Storefront uses **GET /store/products?id=…** with the same `fields` as category PLP so pricing,
 * inventory and middleware behave identically — no duplicate `query.graph` field DSL here.
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
    warn: (msg: string) => void
  }

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
    return res.json({ product_ids: [] })
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
    logger.warn(`[store/by-brand/product-ids] Link query failed for brand ${brand.id}: ${message}`)
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
    const fallback =
      (brandWithProducts[0] as { products?: Array<{ id?: string }> } | undefined)?.products ?? []
    productIds = [
      ...new Set(
        fallback
          .map((p) => p.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    ]
  }

  if (productIds.length === 0) {
    return res.json({ product_ids: [] })
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
      return res.json({ product_ids: [] })
    }
  }

  return res.json({ product_ids: productIds })
}
