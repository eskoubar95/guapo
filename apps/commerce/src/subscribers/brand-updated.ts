import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'

export default async function brandUpdatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; handle: string; name: string; oldHandle?: string }>) {
  const data = event?.data
  const lookupKey = data?.oldHandle ?? data?.handle
  if (!lookupKey) return

  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
  const { docs } = await payloadService.find<{ id: string; brandKey: string }>('brands', {
    where: { brandKey: { equals: lookupKey } },
    limit: 1,
  })

  if (docs?.length === 0) return

  const updates: { displayName?: string; brandKey?: string } = {
    displayName: data.name ?? data.handle,
  }
  if (data.handle != null && data.handle !== lookupKey) {
    updates.brandKey = data.handle
  }
  await payloadService.updateById('brands', String(docs[0].id), updates)
}

export const config: SubscriberConfig = {
  event: 'brand.updated',
}
