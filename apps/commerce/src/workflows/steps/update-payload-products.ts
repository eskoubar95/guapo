import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import type { PayloadCollectionItem } from '../../modules/payload/types'
import { PAYLOAD_MODULE } from '../../modules/payload'
import type PayloadModuleService from '../../modules/payload/service'
import { plainTextToLexical } from '../../lib/lexical'

type MedusaSourceUpdate = {
  payloadId: string
  title?: string
  description?: string
  subtitle?: string
  brandHandle?: string
  sku?: string
  ean?: string
}

type StepInput = {
  updates: MedusaSourceUpdate[]
}

const LOCALES = ['da', 'en'] as const

/**
 * Update existing Payload products with Medusa-source fields.
 * Syncs: title, description, subtitle, specifications (sku, ean, brand).
 * Uses per-locale PATCH so localized fields get correct values (not JSON objects).
 */
export const updatePayloadProductsStep = createStep(
  'update-payload-products',
  async ({ updates }: StepInput, { container }) => {
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const results: PayloadCollectionItem[] = []

    for (const u of updates) {
      const existing = await payloadService.findById<PayloadCollectionItem>('products', u.payloadId)
      if (!existing) continue

      let payloadBrandId: string | undefined
      if (u.brandHandle != null && u.brandHandle.trim() !== '') {
        const { docs: brands } = await payloadService.find<{ id: string }>('brands', {
          where: { brandKey: { equals: u.brandHandle } },
          limit: 1,
        })
        payloadBrandId = brands?.[0]?.id
      }

      const spec = (existing.specifications as Record<string, unknown>) ?? {}
      const hasSpecChanges = u.sku != null || u.ean != null || payloadBrandId != null
      const specPayload =
        hasSpecChanges
          ? {
              ...spec,
              ...(u.sku != null && { sku: u.sku }),
              ...(u.ean != null && { ean: u.ean }),
              ...(payloadBrandId != null && { brand: payloadBrandId }),
            }
          : undefined

      const lexical = u.description?.trim() ? plainTextToLexical(u.description) : undefined

      for (const locale of LOCALES) {
        const payload: Record<string, unknown> = {}

        if (u.title != null && u.title.trim() !== '') {
          payload.title = u.title
        }
        if (lexical) {
          payload.description = lexical
        }
        if (u.subtitle != null && u.subtitle.trim() !== '') {
          payload.subtitle = u.subtitle
        }
        if (specPayload) {
          payload.specifications = specPayload
        }

        if (Object.keys(payload).length === 0) continue

        const { doc } = await payloadService.updateById('products', u.payloadId, payload, {
          locale,
        })
        if (!results.some((r) => r.id === doc.id)) results.push(doc)
      }
    }

    return new StepResponse({ updated: results }, { count: results.length })
  },
)
