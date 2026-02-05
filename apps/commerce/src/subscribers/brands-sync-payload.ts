import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'
import { syncPayloadBrandsWorkflow } from '../workflows/sync-payload-brands'

export default async function brandsSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const productModule = container.resolve(Modules.PRODUCT) as {
    listProducts: (filters: Record<string, unknown>, config?: { take?: number }) => Promise<Array<{ metadata?: Record<string, unknown> }>>
  }
  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const products = await productModule.listProducts({}, { take: 500 }) ?? []
  const brands = new Set<string>()
  for (const p of products) {
    const b = p.metadata?.brand
    if (typeof b === 'string' && b.trim()) brands.add(b.trim())
  }
  if (brands.size === 0) return

  const { docs } = await payloadService.find('brands', { limit: 500 })
  const existingKeys = new Set(
    (docs ?? []).map((d) => (d as Record<string, unknown>).brandKey as string | undefined).filter(Boolean),
  )
  const missing = Array.from(brands).filter((b) => !existingKeys.has(b))
  if (missing.length === 0) return

  await syncPayloadBrandsWorkflow(container).run({
    input: {
      items: missing.map((brandKey) => ({ brandKey })),
    },
  })
}

export const config: SubscriberConfig = {
  event: 'brands.sync-payload',
}
