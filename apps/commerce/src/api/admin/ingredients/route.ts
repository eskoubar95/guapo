import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { PAYLOAD_MODULE } from '../../../modules/payload'
import type PayloadModuleService from '../../../modules/payload/service'

/**
 * GET /admin/ingredients
 * Proxy to Payload ingredients collection for multi-select dropdown.
 * Query: limit (default 500), depth (default 0)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const limit = Math.min(Number(req.query?.limit) || 500, 1000)
  const depth = Math.max(0, Number(req.query?.depth) || 0)

  const payloadService = req.scope.resolve<PayloadModuleService>(PAYLOAD_MODULE)
  const { docs } = await payloadService.find('ingredients', {
    limit,
    depth,
  })

  res.json({
    ingredients: docs ?? [],
  })
}
