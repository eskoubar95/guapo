import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { useQueryGraphStep } from '@medusajs/medusa/core-flows'
import { updatePayloadProductsStep } from './steps/update-payload-products'

type WorkflowInput = { product_ids?: string[] }

/**
 * Updates existing Payload products with Medusa-source fields.
 * Syncs: description, subtitle, specifications (sku, ean, brand).
 */
export const updatePayloadProductsWorkflow = createWorkflow(
  'update-payload-products',
  (input: WorkflowInput) => {
    const { data: products } = useQueryGraphStep({
      entity: 'product',
      fields: [
        'id',
        'title',
        'description',
        'subtitle',
        'metadata',
        'variants.sku',
        'variants.ean',
        'brand.handle',
      ],
      filters: input.product_ids?.length ? { id: input.product_ids } : undefined,
      options: { throwIfKeyNotFound: false },
    })

    const updateData = transform(
      { products },
      ({
        products: prods,
      }: {
        products?: Array<{
          id: string
          title?: string
          description?: string
          subtitle?: string
          metadata?: { payload_id?: string }
          variants?: Array<{ sku?: string; ean?: string }>
          brand?: { handle?: string }
        }>
      }) => {
        const updates = (prods ?? [])
          .filter((p) => p.metadata?.payload_id)
          .map((p) => {
            const primaryVariant = Array.isArray(p.variants) ? p.variants[0] : undefined
            return {
              payloadId: String(p.metadata!.payload_id),
              title: p.title,
              description: p.description,
              subtitle: p.subtitle,
              brandHandle: p.brand?.handle,
              sku: primaryVariant?.sku,
              ean: primaryVariant?.ean,
            }
          })
        return { updates }
      },
    )

    const { updated } = updatePayloadProductsStep(updateData)
    return new WorkflowResponse({ updated })
  },
)
