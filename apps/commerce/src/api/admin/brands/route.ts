import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules } from '@medusajs/framework/utils'
import { BRAND_MODULE } from '../../../modules/brand'
import type BrandModuleService from '../../../modules/brand/service'

/**
 * GET /admin/brands
 * List brands with optional pagination.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const take = Math.min(parseInt(String(req.query.limit ?? 50), 10), 100)
  const skip = parseInt(String(req.query.offset ?? 0), 10)
  const [brands, count] = await brandService.listAndCountBrands(
    {},
    { take, skip }
  )
  res.json({
    brands: brands ?? [],
    count,
    limit: take,
    offset: skip,
  })
}

type CreateBrandBody = { name: string; handle?: string }

/**
 * POST /admin/brands
 * Create one or more brands.
 */
export const POST = async (
  req: MedusaRequest<CreateBrandBody | CreateBrandBody[]>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const body = req.body
  const items = Array.isArray(body)
    ? body
    : body
      ? [body]
      : []
  if (items.length === 0) {
    return res.status(400).json({ message: 'Request body must include name and optional handle' })
  }
  const data = items.map((item) => ({
    name: item.name,
    handle: item.handle ?? item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  }))
  const brands = await brandService.createBrands(data)
  const list = Array.isArray(brands) ? brands : [brands]
  const eventBus = req.scope.resolve(Modules.EVENT_BUS) as { emit: (event: { name: string; data: Record<string, unknown> }) => Promise<void> }
  for (const b of list) {
    await eventBus.emit({ name: 'brand.created', data: { id: b.id, handle: b.handle, name: b.name } })
  }
  res.status(201).json({ brands: list })
}
