import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules } from '@medusajs/framework/utils'
import { payloadSyncLastAt, SYNC_COLLECTIONS } from '../../sync-log'

/**
 * POST /admin/payload/sync/:collection
 * Emits {collection}.sync-payload so subscribers create missing items in Payload.
 * Records last sync time for Settings → Payload page.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { collection } = req.params
  if (!collection || !SYNC_COLLECTIONS.includes(collection as (typeof SYNC_COLLECTIONS)[number])) {
    return res.status(400).json({
      message: `Invalid collection. Allowed: ${SYNC_COLLECTIONS.join(', ')}`,
    })
  }
  const eventBus = req.scope.resolve(Modules.EVENT_BUS) as { emit: (event: { name: string; data: Record<string, unknown> }) => Promise<void> }
  await eventBus.emit({
    name: `${collection}.sync-payload`,
    data: {},
  })
  payloadSyncLastAt[collection] = new Date().toISOString()
  return res.status(200).json({
    message: `Syncing ${collection} with Payload`,
    lastSyncAt: payloadSyncLastAt[collection],
  })
}
