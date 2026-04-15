import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import type { PayloadCollectionItem } from '../../modules/payload/types'
import { PAYLOAD_MODULE } from '../../modules/payload'
import type PayloadModuleService from '../../modules/payload/service'

type MedusaSourceUpdate = {
  payloadId: string
  handle?: string
  parent?: number | null
}

type StepInput = {
  updates: MedusaSourceUpdate[]
}

/**
 * Update existing Payload categories with Medusa-source fields only (handle, parent).
 * Does NOT touch name – it is localized; editors are the source of truth for display names.
 * Payload requires per-locale PATCH for localized fields; we avoid corrupting data.
 */
export const updatePayloadCategoriesStep = createStep(
  'update-payload-categories',
  async ({ updates }: StepInput, { container }) => {
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const results: PayloadCollectionItem[] = []

    for (const u of updates) {
      const payload: Record<string, unknown> = {}
      if (u.handle != null) payload.handle = u.handle
      if (u.parent !== undefined) payload.parent = u.parent === null ? null : u.parent

      if (Object.keys(payload).length === 0) continue

      const { doc } = await payloadService.updateById('categories', u.payloadId, payload)
      results.push(doc)
    }

    return new StepResponse({ updated: results }, { count: results.length })
  },
)
