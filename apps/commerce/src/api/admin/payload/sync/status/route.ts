import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { payloadSyncLastAt, SYNC_COLLECTIONS } from '../../sync-log'

/**
 * GET /admin/payload/sync/status
 * Returns last sync time per collection for Settings → Payload page.
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const status = Object.fromEntries(
    SYNC_COLLECTIONS.map((key) => [
      key,
      { lastSyncAt: payloadSyncLastAt[key] ?? null },
    ]),
  )
  return res.json(status)
}
