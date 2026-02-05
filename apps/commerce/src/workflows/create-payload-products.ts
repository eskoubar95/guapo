import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { useQueryGraphStep, updateProductsWorkflow } from '@medusajs/medusa/core-flows'
import { createPayloadItemsStep } from './steps/create-payload-items'

type WorkflowInput = { product_ids: string[] }

export const createPayloadProductsWorkflow = createWorkflow(
  'create-payload-products',
  (input: WorkflowInput) => {
    const { data: products } = useQueryGraphStep({
      entity: 'product',
      fields: ['id', 'title', 'handle'],
      filters: { id: input.product_ids },
      options: { throwIfKeyNotFound: false },
    })

    const createData = transform({ products }, ({ products: prods }) => ({
      collection: 'products',
      items: (prods ?? []).map((p: { id: string; title?: string; handle?: string }) => ({
        medusa_id: p.id,
        handle: p.handle ?? '',
        title: p.title ?? p.handle ?? '',
      })),
    }))

    const { items } = createPayloadItemsStep(createData)

    const updateData = transform({ items }, ({ items: created }) =>
      (created ?? []).map((doc: { id: string; medusa_id?: string }) => ({
        id: doc.medusa_id ?? doc.id,
        metadata: { payload_id: doc.id },
      })),
    )
    updateProductsWorkflow.runAsStep({ input: { products: updateData } })

    return new WorkflowResponse({ items })
  },
)
