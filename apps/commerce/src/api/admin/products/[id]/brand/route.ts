import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { LinkDefinition } from '@medusajs/framework/types'
import { BRAND_MODULE } from '../../../../../modules/brand'
import type BrandModuleService from '../../../../../modules/brand/service'

/**
 * GET /admin/products/:id/brand
 * Return current brand for product (for Admin UI widget).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId } = req.params
  const query = req.scope.resolve('query') as {
    graph: (opts: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: Array<{ id: string; brand?: { id: string; name: string; handle: string } }> }>
  }
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'brand.*'],
    filters: { id: productId },
  })
  const product = products?.[0]
  if (!product) {
    return res.status(404).json({ message: `Product ${productId} not found` })
  }
  res.json({ brand: product.brand ?? null })
}

type PatchBrandBody = { brand_id?: string | null }

/**
 * PATCH /admin/products/:id/brand
 * Set or remove brand link for a product.
 * Body: { brand_id: string | null } - string to set brand, null to remove
 */
export const PATCH = async (
  req: MedusaRequest<PatchBrandBody>,
  res: MedusaResponse
) => {
  const { id: productId } = req.params
  const brandId = req.body?.brand_id
  const link = req.scope.resolve<{ create: (l: LinkDefinition[]) => Promise<unknown>; dismiss: (l: LinkDefinition) => Promise<unknown> }>(
    ContainerRegistrationKeys.LINK
  )
  const query = req.scope.resolve('query') as {
    graph: (opts: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: Array<{ id: string; brand?: { id: string } }> }>
  }
  const brandService = req.scope.resolve<BrandModuleService>(BRAND_MODULE)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'brand.*'],
    filters: { id: productId },
  })
  const currentProduct = products?.[0]
  if (!currentProduct) {
    return res.status(404).json({ message: `Product ${productId} not found` })
  }

  if (brandId != null && brandId !== '') {
    const newBrand = await brandService.retrieveBrand(brandId)
    if (!newBrand) {
      return res.status(400).json({ message: 'Brand not found' })
    }
  }

  if (currentProduct.brand?.id) {
    await link.dismiss({
      [Modules.PRODUCT]: { product_id: productId },
      [BRAND_MODULE]: { brand_id: currentProduct.brand.id },
    })
  }

  if (brandId != null && brandId !== '') {
    await link.create([
      {
        [Modules.PRODUCT]: { product_id: productId },
        [BRAND_MODULE]: { brand_id: brandId },
      },
    ])
  }

  const { data: updated } = await query.graph({
    entity: 'product',
    fields: ['id', 'brand.*'],
    filters: { id: productId },
  })
  res.json({ product: updated?.[0] })
}
