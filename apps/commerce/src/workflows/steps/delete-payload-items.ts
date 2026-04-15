import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { PAYLOAD_MODULE } from '../../modules/payload'
import type PayloadModuleService from '../../modules/payload/service'

type StepInput = {
  collection: string
  where: Record<string, unknown>
}

export const deletePayloadItemsStep = createStep(
  'delete-payload-items',
  async ({ where, collection }: StepInput, { container }) => {
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    const prev = await payloadService.find(collection, { where })
    await payloadService.delete(collection, { where })
    return new StepResponse({}, { prevData: prev, collection })
  },
  async (data, { container }) => {
    if (!data) return
    const { prevData, collection } = data
    const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
    for (const doc of prevData?.docs ?? []) {
      const { id: _id, ...rest } = doc as { id: string; [k: string]: unknown }
      await payloadService.create(collection, rest as Record<string, unknown>)
    }
  },
)
