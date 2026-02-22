import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { PAYLOAD_MODULE } from '../modules/payload'
import type PayloadModuleService from '../modules/payload/service'

export default async function brandDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; handle: string; name: string }>) {
  const data = event?.data
  if (!data?.handle) return

  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE)
  await payloadService.delete('brands', {
    where: { brandKey: { equals: data.handle } },
  })
}

export const config: SubscriberConfig = {
  event: 'brand.deleted',
}
