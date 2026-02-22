import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { useQueryGraphStep, updateProductsWorkflow } from '@medusajs/medusa/core-flows'
import { createPayloadItemsStep } from './steps/create-payload-items'
import { plainTextToLexical } from '../lib/lexical'

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
        'description',
        'subtitle',
        'variants.sku',
        'variants.ean',
        'brand.handle',
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
          description?: string
          subtitle?: string
          variants?: Array<{ sku?: string; ean?: string }>
          brand?: { handle?: string }
        }>
      }) => ({
        collection: 'products',
        items: (prods ?? []).map((p) => {
          const item: Record<string, unknown> = {
            medusa_id: p.id,
            handle: p.handle ?? '',
            title: (p.title ?? p.handle ?? '').trim(),
          }
          if (p.description?.trim()) {
            const lexical = plainTextToLexical(p.description)
            if (lexical) item.description = lexical
          }
          if (p.subtitle?.trim()) {
            item.subtitle = p.subtitle.trim()
          }
          const primaryVariant = Array.isArray(p.variants) ? p.variants[0] : undefined
          const spec: Record<string, unknown> = {}
          if (primaryVariant) {
            spec.sku = primaryVariant.sku ?? undefined
            spec.ean = primaryVariant.ean ?? undefined
          }
          if (Object.keys(spec).length > 0) item.specifications = spec
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
