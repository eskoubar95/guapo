import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { BRAND_MODULE } from '../../../modules/brand'
import type BrandModuleService from '../../../modules/brand/service'

/**
 * GET /store/brands
 * Returns brands from Brand module for CMS/storefront.
 * Used by Payload CMS sync and storefront brand pages.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)
    const brands = await brandService.listBrands({}, { take: 500 })
    res.json({
      brands: (brands ?? []).map((b) => ({ id: b.id, handle: b.handle, name: b.name })),
    })
  } catch {
    res.json({ brands: [] })
  }
}
