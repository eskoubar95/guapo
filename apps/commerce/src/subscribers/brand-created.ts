import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { syncPayloadBrandsWorkflow } from '../workflows/sync-payload-brands'

export default async function brandCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; handle: string; name: string }>) {
  const data = event?.data
  if (!data?.handle) return

  await syncPayloadBrandsWorkflow(container).run({
    input: {
      items: [
        {
          brandKey: data.handle,
          displayName: data.name ?? data.handle,
          medusa_id: data.id,
        },
      ],
    },
  })
}

export const config: SubscriberConfig = {
  event: 'brand.created',
}
