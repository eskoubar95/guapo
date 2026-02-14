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
      fields: [
        'id',
        'title',
        'handle',
        'variants.sku',
        'variants.ean',
      ],
      filters: { id: input.product_ids },
      options: { throwIfKeyNotFound: false },
    })

    const createData = transform(
      { products },
      ({
        products: prods,
      }: {
        products?: Array<{
          id: string
          title?: string
          handle?: string
          variants?: Array<{ sku?: string; ean?: string }>
        }>
      }) => ({
        collection: 'products',
        items: (prods ?? []).map((p) => {
          const item: Record<string, unknown> = {
            medusa_id: p.id,
            handle: p.handle ?? '',
            title: p.title ?? p.handle ?? '',
          }
          // SKU and EAN from first variant (read-only in Payload; source of truth is Medusa)
          const primaryVariant = Array.isArray(p.variants) ? p.variants[0] : undefined
          if (primaryVariant) {
            item.specifications = {
              sku: primaryVariant.sku ?? undefined,
              ean: primaryVariant.ean ?? undefined,
            }
          }
          return item
        }),
      }),
    )

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
