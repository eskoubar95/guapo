import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'
import { BRAND_MODULE } from '../modules/brand'
import type BrandModuleService from '../modules/brand/service'
import { syncPayloadBrandsWorkflow } from '../workflows/sync-payload-brands'

export default async function brandsSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const brandService = container.resolve<BrandModuleService>(BRAND_MODULE)
  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)

  const brands = await brandService.listBrands({}, { take: 500 }) ?? []
  if (brands.length === 0) return

  const { docs } = await payloadService.find('brands', { limit: 500 })
  const existingKeys = new Set(
    (docs ?? []).map((d) => (d as Record<string, unknown>).brandKey as string | undefined).filter(Boolean),
  )
  const missing = brands.filter((b) => !existingKeys.has(b.handle))
  if (missing.length === 0) return

  await syncPayloadBrandsWorkflow(container).run({
    input: {
      items: missing.map((b) => ({
        brandKey: b.handle,
        displayName: b.name,
        medusa_id: b.id,
      })),
    },
  })
}

export const config: SubscriberConfig = {
  event: 'brands.sync-payload',
}
