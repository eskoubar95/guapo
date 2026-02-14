import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import type { PayloadCollectionItem } from '../../modules/payload/types'
import { PAYLOAD_MODULE } from '../../modules/payload'
import type PayloadModuleService from '../../modules/payload/service'

type MedusaSourceUpdate = {
  payloadId: string
  sku?: string
  ean?: string
}

type StepInput = {
  updates: MedusaSourceUpdate[]
}

/**
 * Update existing Payload products with Medusa-source fields only (sku, ean).
 * Merges into existing specifications – never overwrites editor-filled fields.
 */
export const updatePayloadProductsStep = createStep(
  'update-payload-products',
  async ({ updates }: StepInput, { container }) => {
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const results: PayloadCollectionItem[] = []

    for (const u of updates) {
      const existing = await payloadService.findById<PayloadCollectionItem>('products', u.payloadId)
      if (!existing) continue

      const payload: Record<string, unknown> = {}
      if (u.sku != null || u.ean != null) {
        const spec = (existing.specifications as Record<string, unknown>) ?? {}
        payload.specifications = {
          ...spec,
          ...(u.sku != null && { sku: u.sku }),
          ...(u.ean != null && { ean: u.ean }),
        }
      }
      if (Object.keys(payload).length === 0) continue

      const { doc } = await payloadService.updateById('products', u.payloadId, payload)
      results.push(doc)
    }

    return new StepResponse({ updated: results }, { count: results.length })
  },
)
