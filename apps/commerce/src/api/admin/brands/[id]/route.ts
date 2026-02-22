import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules } from '@medusajs/framework/utils'
import { BRAND_MODULE } from '../../../../modules/brand'
import type BrandModuleService from '../../../../modules/brand/service'

/**
 * GET /admin/brands/:id
 * Retrieve a brand by ID.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const { id } = req.params
  const brand = await brandService.retrieveBrand(id)
  if (!brand) {
    return res.status(404).json({ message: `Brand with id ${id} not found` })
  }
  res.json({ brand })
}

type UpdateBrandBody = { name?: string; handle?: string }

/**
 * PATCH /admin/brands/:id
 * Update a brand.
 */
export const PATCH = async (
  req: MedusaRequest<UpdateBrandBody>,
  res: MedusaResponse
) => {
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const { id } = req.params
  const brand = await brandService.retrieveBrand(id)
  if (!brand) {
    return res.status(404).json({ message: `Brand with id ${id} not found` })
  }
  const body = req.body ?? {}
  const oldHandle = brand.handle
  const updated = await brandService.updateBrands([
    { id, ...(body.name != null && { name: body.name }), ...(body.handle != null && { handle: body.handle }) },
  ])
  const eventBus = req.scope.resolve(Modules.EVENT_BUS) as { emit: (event: { name: string; data: Record<string, unknown> }) => Promise<void> }
  await eventBus.emit({
    name: 'brand.updated',
    data: { id, handle: updated[0].handle, name: updated[0].name, oldHandle },
  })
  res.json({ brand: updated[0] })
}

/**
 * DELETE /admin/brands/:id
 * Delete a brand.
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
  const { id } = req.params
  const brand = await brandService.retrieveBrand(id)
  if (!brand) {
    return res.status(404).json({ message: `Brand with id ${id} not found` })
  }
  await brandService.deleteBrands([id])
  const eventBus = req.scope.resolve(Modules.EVENT_BUS) as { emit: (event: { name: string; data: Record<string, unknown> }) => Promise<void> }
  await eventBus.emit({ name: 'brand.deleted', data: { id, handle: brand.handle, name: brand.name } })
  res.status(200).json({ id, object: 'brand', deleted: true })
}
