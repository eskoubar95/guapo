import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import type { PayloadUpsertData, PayloadItemResult, PayloadCollectionItem } from '../../modules/payload/types'
import { PAYLOAD_MODULE } from '../../modules/payload'
import type PayloadModuleService from '../../modules/payload/service'
import { MedusaError } from '@medusajs/framework/utils'

type StepInput = {
  collection: string
  items: PayloadUpsertData[]
}

/** Payload categories: handle [a-z0-9-] 1–100 chars; relationship parent as string id. Returns strict body for API. */
function buildCategoryBody(item: PayloadUpsertData): PayloadUpsertData | null {
  const raw = item?.handle != null ? String(item.handle) : ''
  const handle = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const medusaId = item?.medusa_id != null ? String(item.medusa_id).replace(/[^a-z0-9-]/gi, '').slice(0, 8) : ''
  const base = handle.length >= 1 ? handle.slice(0, 100) : (medusaId ? `category-${medusaId}` : 'category')
  let final = base.length >= 1 ? base.slice(0, 100) : 'category'
  if (final.length === 0 || final.length > 100) return null
  const body: PayloadUpsertData = {
    handle: final,
    name: item?.name != null ? String(item.name).trim() || final : final,
    medusa_id: item?.medusa_id != null ? String(item.medusa_id) : '',
  }
  const parentVal = item?.parent != null ? Number(item.parent) : 0
  if (parentVal > 0) body.parent = parentVal
  return body
}

/** Ensure every handle in the batch is unique (Payload unique constraint). */
function dedupeCategoryHandles(bodies: PayloadUpsertData[]): PayloadUpsertData[] {
  const seen = new Set<string>()
  return bodies.map((body) => {
    let handle = (body.handle as string) ?? ''
    if (seen.has(handle)) {
      const suffix = (body.medusa_id as string)?.replace(/[^a-z0-9-]/gi, '').slice(0, 8) || String(seen.size)
      handle = `${handle}-${suffix}`.slice(0, 100)
    }
    seen.add(handle)
    return { ...body, handle }
  })
}

export const createPayloadItemsStep = createStep(
  'create-payload-items',
  async ({ items, collection }: StepInput, { container }) => {
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    let toCreate: PayloadUpsertData[]
    if (collection === 'categories') {
      const built = items.map((item) => buildCategoryBody(item)).filter((item): item is PayloadUpsertData => item != null)
      toCreate = dedupeCategoryHandles(built)
    } else {
      toCreate = items
    }

    if (collection === 'categories') {
      const created: PayloadItemResult<PayloadCollectionItem>[] = []
      for (const item of toCreate) {
        try {
          const result = await payloadService.create(collection, item)
          created.push(result as PayloadItemResult<PayloadCollectionItem>)
        } catch (err) {
          const msg = err instanceof MedusaError ? err.message : String(err)
          if (msg.includes('400') && msg.toLowerCase().includes('handle')) {
            continue
          }
          throw err
        }
      }
      return new StepResponse(
        { items: created.map((c) => c.doc) },
        { ids: created.map((c) => c.doc.id), collection },
      )
    }

    const created = await Promise.all(toCreate.map((item) => payloadService.create(collection, item)))
    return new StepResponse(
      { items: created.map((c: PayloadItemResult<PayloadCollectionItem>) => c.doc) },
      { ids: created.map((c: PayloadItemResult<PayloadCollectionItem>) => c.doc.id), collection },
    )
  },
  async (data, { container }) => {
    if (!data) return
    const { ids, collection } = data
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    if (ids?.length) {
      await payloadService.delete(collection, {
        where: { id: { in: ids } },
      })
    }
  },
)
