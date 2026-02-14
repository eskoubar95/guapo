import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'
import { syncPayloadCategoriesWorkflow } from '../workflows/sync-payload-categories'
import { updatePayloadCategoriesWorkflow } from '../workflows/update-payload-categories'

/**
 * Categories sync follows the same pattern as products (Medusa docs):
 * - Determine "already in Payload" by medusa_id (like products use metadata.payload_id).
 * - Sync only missing categories. Handle is made unique by including medusa_id suffix.
 */

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Unique handle for Payload: [a-z0-9-] only, always ends with -{idSlug} so no duplicates. */
function uniqueHandle(nameOrHandle: string, medusaId: string): string {
  const slug = toSlug(nameOrHandle || 'category')
  const idSlug = medusaId.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 12)
  const base = slug.length > 0 ? slug : 'category'
  const out = idSlug ? `${base}-${idSlug}` : base
  return out.slice(0, 100)
}

type MedusaCategory = { id: string; handle?: string; name?: string; parent_category_id?: string | null }

/** Turn handle into display name when name is missing: "skincare" -> "Skincare", "eye-cream" -> "Eye cream". */
function handleToDisplayName(handle: string): string {
  if (!handle || !handle.trim()) return 'Category'
  return handle
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export default async function categoriesSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const productModule = container.resolve(Modules.PRODUCT) as {
    listProductCategories: (
      filters?: Record<string, unknown>,
      config?: { take?: number; skip?: number; select?: string[] }
    ) => Promise<MedusaCategory[]>
  }
  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const raw = (await productModule.listProductCategories(
    {},
    { take: 200, select: ['id', 'name', 'handle', 'parent_category_id'] },
  ) ?? [])
  if (raw.length === 0) {
    console.warn('[Payload sync] No product categories in Medusa. Run seed or create categories in Admin.')
    return
  }

  const { docs } = await payloadService.find('categories', { limit: 1000 })
  const existingMedusaIds = new Set(
    (docs ?? [])
      .map((d) => (d as Record<string, unknown>).medusa_id as string | undefined)
      .filter(Boolean),
  )

  const missing = raw.filter((c) => !existingMedusaIds.has(c.id))
  const roots = missing.filter((c) => !c.parent_category_id)
  const children = missing.filter((c) => Boolean(c.parent_category_id))

  if (roots.length > 0) {
    await syncPayloadCategoriesWorkflow(container).run({
      input: {
        items: roots.map((c) => {
          const displayName = (c.name ?? '').trim() || handleToDisplayName(c.handle ?? '')
          return {
            medusa_id: c.id,
            handle: uniqueHandle(c.handle ?? c.name ?? '', c.id),
            name: displayName || 'Category',
          }
        }),
      },
    })
  }

  if (children.length > 0) {
    const { docs: docsAfter } = await payloadService.find('categories', { limit: 1000 })
    const parentMap = new Map<string, number>(
      (docsAfter ?? []).map((d) => {
        const r = d as Record<string, unknown>
        const mid = r.medusa_id as string | undefined
        const id = r.id as number | undefined
        return mid != null && id != null ? [mid, id] : []
      }).filter((pair): pair is [string, number] => pair.length === 2),
    )
    const childrenWithParent = children
      .map((c) => {
        const parentId = c.parent_category_id ? parentMap.get(c.parent_category_id) : undefined
        if (parentId == null) return null
        const displayName = (c.name ?? '').trim() || handleToDisplayName(c.handle ?? '')
        return {
          medusa_id: c.id,
          handle: uniqueHandle(c.handle ?? c.name ?? '', c.id),
          name: displayName || 'Category',
          parent: parentId,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item != null)
    if (childrenWithParent.length > 0) {
      await syncPayloadCategoriesWorkflow(container).run({
        input: { items: childrenWithParent },
      })
    }
  }

  // Update existing Payload categories with Medusa-source fields (name, handle, parent)
  const { docs: allDocs } = await payloadService.find('categories', { limit: 1000 })
  const medusaIdToPayloadId = new Map<string, number>(
    (allDocs ?? []).map((d) => {
      const r = d as Record<string, unknown>
      const mid = r.medusa_id as string | undefined
      const id = r.id as number | undefined
      return mid != null && id != null ? [mid, id] : []
    }).filter((pair): pair is [string, number] => pair.length === 2),
  )

  const updates = raw
    .filter((c) => medusaIdToPayloadId.has(c.id))
    .map((c) => {
      const payloadId = String(medusaIdToPayloadId.get(c.id)!)
      const parent =
        c.parent_category_id != null
          ? medusaIdToPayloadId.get(c.parent_category_id) ?? null
          : null
      return {
        payloadId,
        handle: uniqueHandle(c.handle ?? c.name ?? '', c.id),
        parent,
      }
    })
    .filter((u) => u.payloadId)

  if (updates.length > 0) {
    await updatePayloadCategoriesWorkflow(container).run({ input: { updates } })
  }
}

export const config: SubscriberConfig = {
  event: 'categories.sync-payload',
}
