import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'
import { syncPayloadProductTypesWorkflow } from '../workflows/sync-payload-product-types'

export default async function productTypesSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const productModule = container.resolve(Modules.PRODUCT) as {
    listProductTypes: (filters?: Record<string, unknown>) => Promise<Array<{ value: string }>>
  }
  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const types = await productModule.listProductTypes({}) ?? []
  if (types.length === 0) return

  const { docs } = await payloadService.find('product_types', { limit: 200 })
  const existingValues = new Set(
    (docs ?? []).map((d) => (d as Record<string, unknown>).value as string | undefined).filter(Boolean),
  )
  const missing = types.filter((t) => !existingValues.has(t.value))
  if (missing.length === 0) return

  await syncPayloadProductTypesWorkflow(container).run({
    input: {
      items: missing.map((t) => ({ value: t.value, name: t.value })),
    },
  })
}

export const config: SubscriberConfig = {
  event: 'product_types.sync-payload',
}
