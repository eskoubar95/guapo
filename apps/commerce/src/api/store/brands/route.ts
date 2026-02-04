import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules } from '@medusajs/framework/utils'

/**
 * GET /store/brands
 * Returns distinct product.metadata.brand values for CMS/admin dropdowns.
 * Used by Payload CMS to populate brand lists without fetching all products.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productModule = req.scope.resolve(Modules.PRODUCT) as {
      listProducts: (filters: Record<string, unknown>, config?: { take?: number; select?: string[] }) => Promise<Array<{ metadata?: Record<string, unknown> }>>
    }
    const products = await productModule.listProducts(
      {},
      { take: 500 }
    )
    const brands = new Set<string>()
    for (const p of products ?? []) {
      const b = p.metadata?.brand
      if (typeof b === 'string' && b.trim()) brands.add(b.trim())
    }
    res.json({ brands: Array.from(brands) })
  } catch {
    res.json({ brands: [] })
  }
}
