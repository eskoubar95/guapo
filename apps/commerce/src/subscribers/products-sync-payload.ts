import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createPayloadProductsWorkflow } from '../workflows/create-payload-products'
import { updatePayloadProductsWorkflow } from '../workflows/update-payload-products'

const BATCH = 100

export default async function productsSyncPayloadHandler({
  container,
}: SubscriberArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as { info?: (m: string) => void; error?: (m: string) => void } | undefined
  const log = (msg: string) => logger?.info?.(msg) ?? console.log(`[products-sync-payload] ${msg}`)
  const logErr = (msg: string) => logger?.error?.(msg) ?? console.error(`[products-sync-payload] ${msg}`)

  const query = container.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      pagination?: { take: number; skip: number }
    }) => Promise<{ data: Array<{ id: string; metadata?: Record<string, unknown> }>; metadata?: { count?: number } }>
  }

  const allProductIds: string[] = []
  let offset = 0
  let total = 0
  let created = 0

  try {
    // 1. Create missing Payload products
    let hasMore = true
    while (hasMore) {
      const { data: products = [], metadata } = await query.graph({
        entity: 'product',
        fields: ['id', 'metadata'],
        pagination: { take: BATCH, skip: offset },
      })
      hasMore = products.length === BATCH
      total = metadata?.count ?? total + products.length
      for (const p of products) allProductIds.push(p.id)
      const withoutPayload = products.filter((p) => !p.metadata?.payload_id)
      if (withoutPayload.length > 0) {
        log(`Creating ${withoutPayload.length} product(s) in Payload...`)
        const { result } = await createPayloadProductsWorkflow(container).run({
          input: { product_ids: withoutPayload.map((p) => p.id) },
        })
        const count = Array.isArray(result?.items) ? result.items.length : 0
        created += count
        log(`Created ${count} product(s)`)
      }
      offset += BATCH
    }

    // 2. Update existing Payload products (Medusa-source fields only: images, sku, ean)
    if (allProductIds.length > 0) {
      const { result } = await updatePayloadProductsWorkflow(container).run({
        input: { product_ids: allProductIds },
      })
      const updatedCount = Array.isArray(result?.updated) ? result.updated.length : 0
      if (updatedCount > 0) log(`Updated ${updatedCount} product(s) with Medusa data (SKU, EAN)`)
    }

    if (created === 0) {
      log('No new products to create (all already in Payload). Updated existing where applicable.')
    }
  } catch (err) {
    logErr(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    throw err
  }
}

export const config: SubscriberConfig = {
  event: 'products.sync-payload',
}
