import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { createPayloadProductsWorkflow } from '../workflows/create-payload-products'

const BATCH = 100

export default async function productsSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const query = container.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      pagination?: { take: number; skip: number }
    }) => Promise<{ data: Array<{ id: string; metadata?: Record<string, unknown> }>; metadata?: { count?: number } }>
  }
  let offset = 0
  let total = 0
  do {
    const { data: products = [], metadata } = await query.graph({
      entity: 'product',
      fields: ['id', 'metadata'],
      pagination: { take: BATCH, skip: offset },
    })
    total = metadata?.count ?? products.length
    const withoutPayload = products.filter((p) => !p.metadata?.payload_id)
    if (withoutPayload.length > 0) {
      await createPayloadProductsWorkflow(container).run({
        input: { product_ids: withoutPayload.map((p) => p.id) },
      })
    }
    offset += BATCH
  } while (offset < total)
}

export const config: SubscriberConfig = {
  event: 'products.sync-payload',
}
