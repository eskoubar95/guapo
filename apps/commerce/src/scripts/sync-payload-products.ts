/**
 * Manual sync: Medusa products → Payload CMS
 *
 * 1. Creates Payload documents for Medusa products without metadata.payload_id
 * 2. Updates existing Payload products with Medusa-source fields (SKU, EAN)
 *
 * Run with: pnpm sync:payload (or: medusa exec ./src/scripts/sync-payload-products.ts)
 */

import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createPayloadProductsWorkflow } from '../workflows/create-payload-products'
import { updatePayloadProductsWorkflow } from '../workflows/update-payload-products'

const BATCH = 100

export default async function syncPayloadProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as { info: (m: string) => void }
  const query = container.resolve('query') as {
    graph: (opts: {
      entity: string
      fields: string[]
      pagination?: { take: number; skip: number }
    }) => Promise<{ data: Array<{ id: string; metadata?: Record<string, unknown> }>; metadata?: { count?: number } }>
  }

  logger.info('🔄 Syncing Medusa products to Payload...')

  let offset = 0
  let total = 0
  let created = 0
  const allProductIds: string[] = []

  do {
    const { data: products = [], metadata } = await query.graph({
      entity: 'product',
      fields: ['id', 'metadata'],
      pagination: { take: BATCH, skip: offset },
    })
    total = metadata?.count ?? products.length
    for (const p of products) allProductIds.push(p.id)
    const withoutPayload = products.filter((p) => !p.metadata?.payload_id)

    if (withoutPayload.length > 0) {
      logger.info(`Creating ${withoutPayload.length} product(s) in Payload...`)
      const { result } = await createPayloadProductsWorkflow(container).run({
        input: { product_ids: withoutPayload.map((p) => p.id) },
      })
      created += Array.isArray(result?.items) ? result.items.length : 0
    }
    offset += BATCH
  } while (offset < total)

  if (allProductIds.length > 0) {
    const { result } = await updatePayloadProductsWorkflow(container).run({
      input: { product_ids: allProductIds },
    })
    const updated = Array.isArray(result?.updated) ? result.updated.length : 0
    if (updated > 0) logger.info(`Updated ${updated} product(s) with Medusa data (SKU, EAN)`)
  }

  logger.info(`✅ Sync complete. ${created} created, existing products updated where applicable.`)
}
