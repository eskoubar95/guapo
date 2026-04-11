import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { createPayloadItemsStep } from './steps/create-payload-items'

export const syncPayloadBrandsWorkflow = createWorkflow(
  'sync-payload-brands',
  (input: {
    items: Array<{ brandKey: string; displayName?: string; medusa_id?: string }>
  }) => {
    const createData = transform({ input }, ({ input: i }) => ({
      collection: 'brands',
      items: (i.items ?? []).map((b) => ({
        brandKey: b.brandKey,
        displayName: b.displayName ?? b.brandKey,
        ...(b.medusa_id != null && String(b.medusa_id).length > 0
          ? { medusa_id: String(b.medusa_id) }
          : {}),
      })),
    }))
    const { items } = createPayloadItemsStep(createData)
    return new WorkflowResponse({ items })
  },
)
