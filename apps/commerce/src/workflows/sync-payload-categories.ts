import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { createPayloadItemsStep } from './steps/create-payload-items'

/**
 * Same pattern as create-payload-products: input items with medusa_id, handle, name, optional parent.
 * Subscriber ensures handle is unique (includes medusa_id suffix). We only sanitize and pass through.
 */
type CategoryItem = { medusa_id: string; handle: string; name?: string; parent?: number }

function sanitizeHandle(h: unknown, medusaId: string): string {
  const s = typeof h === 'string' ? h : String(h ?? '')
  const out = s.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const base = out.length >= 1 ? out.slice(0, 100) : null
  if (base) return base
  const idSlug = medusaId.replace(/[^a-z0-9-]/gi, '').slice(0, 12)
  return idSlug ? `cat-${idSlug}`.slice(0, 100) : 'cat'
}

export const syncPayloadCategoriesWorkflow = createWorkflow(
  'sync-payload-categories',
  (input: { items: CategoryItem[] }) => {
    const createData = transform({ input }, ({ input: i }) => {
      const items = (i.items ?? [])
        .filter((c) => c && String(c.medusa_id ?? '').length > 0)
        .map((c) => {
          const mid = String(c.medusa_id ?? '')
          const handle = sanitizeHandle(c.handle ?? c.name, mid)
          return {
            medusa_id: mid,
            handle,
            name: String((c.name ?? c.handle ?? '').trim() || handle),
            ...(c.parent != null && Number(c.parent) > 0 ? { parent: Number(c.parent) } : {}),
          }
        })
        .filter((it) => it.handle.length >= 1 && it.handle.length <= 100)
      return { collection: 'categories', items }
    })
    const { items } = createPayloadItemsStep(createData)
    return new WorkflowResponse({ items })
  },
)
