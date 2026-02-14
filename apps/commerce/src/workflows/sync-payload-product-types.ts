import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { createPayloadItemsStep } from './steps/create-payload-items'

type ProductTypeItem = { value: string; name?: string }

export const syncPayloadProductTypesWorkflow = createWorkflow(
  'sync-payload-product-types',
  (input: { items: ProductTypeItem[] }) => {
    const createData = transform({ input }, ({ input: i }) => ({
      collection: 'product_types',
      items: (i.items ?? []).map((t) => ({
        value: t.value,
        name: t.name ?? t.value,
      })),
    }))
    const { items } = createPayloadItemsStep(createData)
    return new WorkflowResponse({ items })
  },
)
