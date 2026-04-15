/**
 * GET /api/storefront/product/[handle]
 *
 * Returns a product by handle with full depth (skinTypes, concerns, ingredients).
 * Uses Payload Local API to ensure relations are correctly populated.
 * For storefront PDP consumption.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** SEO upload field sometimes serializes as id only; populate so storefront can build og:image. */
async function ensureProductMetaImage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  doc: Record<string, unknown>,
): Promise<void> {
  const meta = doc.meta
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return
  const m = meta as Record<string, unknown>
  const img = m.image
  if (typeof img === 'number') {
    try {
      const media = await payload.findByID({
        collection: 'media',
        id: img,
        depth: 0,
      })
      m.image = media
    } catch {
      /* leave as id */
    }
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    const { searchParams } = new URL(req.url)
    const locale = (searchParams.get('locale') ?? 'da') as 'da' | 'en'
    const fallbackLocale = (searchParams.get('fallback-locale') ?? 'da') as 'da' | 'en'

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'products',
      where: { handle: { equals: handle } },
      limit: 1,
      depth: 4,
      locale,
      fallbackLocale,
    })

    const doc = result.docs[0]
    if (!doc) {
      return NextResponse.json({ docs: [] }, { status: 200 })
    }

    await ensureProductMetaImage(payload, doc as unknown as Record<string, unknown>)

    return NextResponse.json({ docs: [doc] }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
