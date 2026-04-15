/**
 * GET /api/storefront/globals/tracking
 *
 * Public read of Tracking global (GTM container ID). No locale — fields are global.
 * Query: draft (true|false).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const draft = searchParams.get('draft') === 'true'

    const payload = await getPayload({ config })
    const result = await payload.findGlobal({
      slug: 'tracking',
      depth: 0,
      draft,
      overrideAccess: true,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tracking'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
