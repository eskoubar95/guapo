/**
 * GET /api/storefront/brand/[handle]
 *
 * brandKey in Payload matches Medusa brand handle (URL segment).
 * Optional `medusa_id` for lookup when storefront passes Medusa brand id.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    const { searchParams } = new URL(req.url)
    const locale = (searchParams.get('locale') ?? 'da') as 'da' | 'en'
    const fallbackLocale = (searchParams.get('fallback-locale') ?? 'da') as 'da' | 'en'
    const medusaId = searchParams.get('medusa_id')?.trim() || ''

    const payload = await getPayload({ config })
    const base = {
      collection: 'brands' as const,
      limit: 1,
      depth: 2,
      locale,
      fallbackLocale,
    }
    let result =
      medusaId.length > 0
        ? await payload.find({
            ...base,
            where: { medusa_id: { equals: medusaId } },
          })
        : await payload.find({
            ...base,
            where: { brandKey: { equals: handle } },
          })

    if (result.docs.length === 0 && medusaId.length > 0) {
      result = await payload.find({
        ...base,
        where: { brandKey: { equals: handle } },
      })
    }

    const doc = result.docs[0]
    if (!doc) {
      return NextResponse.json({ docs: [] }, { status: 200 })
    }

    return NextResponse.json({ docs: [doc] }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brand'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
