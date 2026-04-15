import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { deletePayloadItemsStep } from './steps/delete-payload-items'

type WorkflowInput = { product_ids: string[] }

export const deletePayloadProductsWorkflow = createWorkflow(
  'delete-payload-products',
  (input: WorkflowInput) => {
    const deleteData = transform({ product_ids: input.product_ids }, ({ product_ids }) => ({
      collection: 'products',
      where: {
        medusa_id: { in: product_ids },
      },
    }))

    deletePayloadItemsStep(deleteData)
    return new WorkflowResponse(undefined)
  },
)
