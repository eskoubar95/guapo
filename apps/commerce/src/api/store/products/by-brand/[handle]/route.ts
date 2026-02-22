import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

/**
 * GET /store/products/by-brand/:handle
 * Returns products linked to the brand with the given handle.
 * Used by storefront brand PLP.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { handle } = req.params
  if (!handle) {
    return res.status(400).json({ message: 'Brand handle required' })
  }
  const query = req.scope.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: Array<{ id: string; handle?: string; title?: string; products?: unknown[] }> }>
    index?: (opts: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
      skip?: number
      take?: number
    }) => Promise<{ data: unknown[]; metadata?: { count?: number } }>
  }
  try {
    const { data: brands } = await query.graph({
      entity: 'brand',
      fields: ['*', 'products.*'],
      filters: { handle },
    })
    const brand = brands?.[0]
    if (!brand || !brand.products) {
      return res.json({ products: [], count: 0 })
    }
    const products = Array.isArray(brand.products) ? brand.products : []
    res.json({ products, count: products.length })
  } catch {
    res.json({ products: [], count: 0 })
  }
}
