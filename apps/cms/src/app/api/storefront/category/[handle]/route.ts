/**
 * GET /api/storefront/category/[handle]
 *
 * Returns a category by Medusa handle with depth for meta.image.
 * Uses Payload Local API (same pattern as /api/storefront/product/[handle]).
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
    /** Medusa product_category id — preferred lookup when sync gave Payload a suffixed handle (≠ storefront URL handle). */
    const medusaId = searchParams.get('medusa_id')?.trim() || ''

    const payload = await getPayload({ config })
    const base = {
      collection: 'categories' as const,
      limit: 1,
      depth: 2,
      locale,
      fallbackLocale,
    }
    const result =
      medusaId.length > 0
        ? await payload.find({
            ...base,
            where: { medusa_id: { equals: medusaId } },
          })
        : await payload.find({
            ...base,
            where: { handle: { equals: handle } },
          })

    const doc = result.docs[0]
    if (!doc) {
      return NextResponse.json({ docs: [] }, { status: 200 })
    }

    return NextResponse.json({ docs: [doc] }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
