import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { PAYLOAD_MODULE } from '../../../../../../modules/payload'
import type PayloadModuleService from '../../../../../../modules/payload/service'

type IngredientDoc = {
  id: string
  name?: string | Record<string, string>
  inciName?: string
}

/**
 * Parse raw comma-separated list. Split only on ", " (comma + space) so that
 * names containing a comma without space (e.g. 1,2-Hexanediol) stay as one item.
 */
function parseRawList(rawList: string): string[] {
  return rawList
    .split(/,\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

type ParseBody = { rawList: string }

/**
 * POST /admin/products/:id/ingredients/parse
 * Parse comma-separated list, find-or-create ingredients in Payload, link to product.
 * Body: { rawList: string }
 */
export const POST = async (
  req: MedusaRequest<ParseBody>,
  res: MedusaResponse,
) => {
  const { id: productId } = req.params
  const rawList = req.body?.rawList
  if (typeof rawList !== 'string') {
    return res.status(400).json({ message: 'rawList must be a string' })
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

  const { docs: productsDocs } = await payloadService.find<{ id: string }>(
    'products',
    {
      where: { handle: { equals: handle } },
      limit: 1,
      depth: 0,
    },
  )
  const payloadProduct = productsDocs?.[0]
  if (!payloadProduct) {
    return res.status(404).json({
      message: 'Sync product to Payload first',
    })
  }

  const tokens = parseRawList(rawList)
  if (tokens.length === 0) {
    return res.status(400).json({ message: 'No valid ingredients in rawList' })
  }

  const { docs: allIngredients } = await payloadService.find<IngredientDoc>(
    'ingredients',
    { limit: 1000, depth: 0 },
  )

  const lookup = new Map<string, string>()
  for (const doc of allIngredients ?? []) {
    const inci = doc.inciName?.trim()
    if (inci) lookup.set(inci.toLowerCase(), doc.id)
    const name = typeof doc.name === 'string' ? doc.name : doc.name?.en
    if (name) lookup.set(name.toLowerCase(), doc.id)
  }

  const ingredientIds: string[] = []
  let created = 0
  let found = 0

  for (const trimmed of tokens) {
    const key = trimmed.toLowerCase()
    let id = lookup.get(key)
    if (id) {
      found++
      ingredientIds.push(id)
      continue
    }

    const inciUpper = trimmed.toUpperCase()
    id = lookup.get(inciUpper.toLowerCase())
    if (id) {
      found++
      ingredientIds.push(id)
      continue
    }

    const createdResult = await payloadService.create<IngredientDoc>(
      'ingredients',
      {
        name: trimmed,
        inciName: inciUpper,
      },
    )
    const newId = createdResult?.doc?.id
    if (!newId) {
      return res.status(500).json({ message: 'Failed to create ingredient' })
    }
    created++
    lookup.set(key, newId)
    lookup.set(inciUpper.toLowerCase(), newId)
    ingredientIds.push(newId)
  }

  const seen = new Set<string>()
  const dedupedIds = ingredientIds.filter((id) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })

  await payloadService.updateById('products', payloadProduct.id, {
    ingredients: dedupedIds,
  })

  const { docs: updatedDocs } = await payloadService.find<{
    id: string
    ingredients?: Array<{ id: string; name?: unknown; inciName?: string }>
  }>('products', {
    where: { id: { equals: payloadProduct.id } },
    limit: 1,
    depth: 1,
  })
  const ingredients = Array.isArray(updatedDocs?.[0]?.ingredients)
    ? updatedDocs[0].ingredients
    : []

  res.json({
    ingredients,
    created,
    found,
  })
}
