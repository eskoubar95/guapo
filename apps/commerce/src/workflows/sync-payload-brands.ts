import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { createPayloadItemsStep } from './steps/create-payload-items'

export const syncPayloadBrandsWorkflow = createWorkflow(
  'sync-payload-brands',
  (input: { items: Array<{ brandKey: string }> }) => {
    const createData = transform({ input }, ({ input: i }) => ({
      collection: 'brands',
      items: (i.items ?? []).map((b) => ({ brandKey: b.brandKey })),
    }))
    const { items } = createPayloadItemsStep(createData)
    return new WorkflowResponse({ items })
  },
)
