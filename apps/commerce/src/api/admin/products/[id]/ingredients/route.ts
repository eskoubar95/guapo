import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { PAYLOAD_MODULE } from '../../../../../modules/payload'
import type PayloadModuleService from '../../../../../modules/payload/service'

/**
 * GET /admin/products/:id/ingredients
 * Return current ingredients for product (from Payload Product by handle).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId } = req.params
  const query = req.scope.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: Array<{ id: string; handle?: string }> }>
  }
  const payloadService = req.scope.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
    filters: { id: productId },
  })
  const product = products?.[0]
  if (!product) {
    return res.status(404).json({ message: `Product ${productId} not found` })
  }

  const handle = product.handle
  if (!handle) {
    return res.json({
      ingredients: [],
      payloadProductId: null,
      message: 'Product has no handle',
    })
  }

  const { docs } = await payloadService.find<{ id: string; ingredients?: Array<{ id: string; name?: string; inciName?: string }> }>(
    'products',
    {
      where: { handle: { equals: handle } },
      limit: 1,
      depth: 1,
    },
  )
  const payloadProduct = docs?.[0]
  if (!payloadProduct) {
    return res.json({
      ingredients: [],
      payloadProductId: null,
      message: 'Sync product to Payload first',
    })
  }

  const ingredients = Array.isArray(payloadProduct.ingredients)
    ? payloadProduct.ingredients
    : []
  res.json({
    ingredients,
    payloadProductId: payloadProduct.id,
  })
}

type PatchIngredientsBody = { ingredient_ids: string[] }

/**
 * PATCH /admin/products/:id/ingredients
 * Set ingredient list for Payload Product (replaces existing).
 * Body: { ingredient_ids: string[] }
 */
export const PATCH = async (
  req: MedusaRequest<PatchIngredientsBody>,
  res: MedusaResponse,
) => {
  const { id: productId } = req.params
  const ingredientIds = req.body?.ingredient_ids
  if (!Array.isArray(ingredientIds)) {
    return res.status(400).json({ message: 'ingredient_ids must be an array' })
  }

  const query = req.scope.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: Array<{ id: string; handle?: string }> }>
  }
  const payloadService = req.scope.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
    filters: { id: productId },
  })
  const product = products?.[0]
  if (!product) {
    return res.status(404).json({ message: `Product ${productId} not found` })
  }

  const handle = product.handle
  if (!handle) {
    return res.status(400).json({ message: 'Product has no handle' })
  }

  const { docs } = await payloadService.find<{ id: string }>('products', {
    where: { handle: { equals: handle } },
    limit: 1,
    depth: 0,
  })
  const payloadProduct = docs?.[0]
  if (!payloadProduct) {
    return res.status(404).json({
      message: 'Sync product to Payload first',
    })
  }

  await payloadService.updateById('products', payloadProduct.id, {
    ingredients: ingredientIds,
  })

  const { docs: updatedDocs } = await payloadService.find<{
    id: string
    ingredients?: Array<{ id: string; name?: string; inciName?: string }>
  }>('products', {
    where: { id: { equals: payloadProduct.id } },
    limit: 1,
    depth: 1,
  })
  const updated = updatedDocs?.[0]
  const ingredients = Array.isArray(updated?.ingredients) ? updated.ingredients : []
  res.json({ ingredients })
}
