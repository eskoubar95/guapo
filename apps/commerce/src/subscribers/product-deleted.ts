import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { deletePayloadProductsWorkflow } from '../workflows/delete-payload-products'

export default async function productDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const id = event?.data?.id
  if (!id) return
  await deletePayloadProductsWorkflow(container).run({
    input: { product_ids: [id] },
  })
}

export const config: SubscriberConfig = {
  event: 'product.deleted',
}
