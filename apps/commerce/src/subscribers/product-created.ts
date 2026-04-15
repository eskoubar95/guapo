import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { createPayloadProductsWorkflow } from '../workflows/create-payload-products'

export default async function productCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const id = event?.data?.id
  if (!id) return
  await createPayloadProductsWorkflow(container).run({
    input: { product_ids: [id] },
  })
}

export const config: SubscriberConfig = {
  event: 'product.created',
}
