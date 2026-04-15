import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { updatePayloadCategoriesStep } from './steps/update-payload-categories'

type CategoryUpdate = {
  payloadId: string
  handle?: string
  parent?: number | null
}

type WorkflowInput = { updates: CategoryUpdate[] }

/**
 * Updates existing Payload categories with Medusa-source fields only.
 * Only touches: name, handle, parent.
 * Never overwrites: body, meta (SEO), slug override.
 */
export const updatePayloadCategoriesWorkflow = createWorkflow(
  'update-payload-categories',
  (input: WorkflowInput) => {
    const updateData = transform({ input }, ({ input: i }) => ({
      updates: (i.updates ?? []).filter((u) => u?.payloadId),
    }))

    const { updated } = updatePayloadCategoriesStep(updateData)
    return new WorkflowResponse({ updated })
  },
)
