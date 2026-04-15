/**
 * GET /api/storefront/concern/[value]
 *
 * Concern taxonomy row by stable `value` (e.g. acne) for storefront PLP metadata.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const VALID_LOCALES = ['da', 'en'] as const
type SupportedLocale = (typeof VALID_LOCALES)[number]

const normalizeLocale = (value: string | null): SupportedLocale =>
  value && VALID_LOCALES.includes(value as SupportedLocale) ? (value as SupportedLocale) : 'da'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ value: string }> },
) {
  try {
    const { value: rawValue } = await params
    const value = decodeURIComponent(rawValue || '').trim()
    if (!value) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const locale = normalizeLocale(searchParams.get('locale'))

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'concerns',
      where: { value: { equals: value } },
      limit: 1,
      locale,
      depth: 0,
    })

    const doc = result.docs[0]
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const label = typeof doc.label === 'string' ? doc.label : ''
    const metaRaw = doc.meta
    let meta: { title: string | null; description: string | null } | undefined
    if (metaRaw && typeof metaRaw === 'object' && !Array.isArray(metaRaw)) {
      const m = metaRaw as Record<string, unknown>
      meta = {
        title: typeof m.title === 'string' ? m.title : null,
        description: typeof m.description === 'string' ? m.description : null,
      }
    }

    return NextResponse.json(
      {
        value: typeof doc.value === 'string' ? doc.value : value,
        label,
        meta,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=120',
        },
      },
    )
  } catch (err) {
    console.error('[storefront/concern] GET failed', err)
    return NextResponse.json({ error: 'Failed to fetch concern' }, { status: 500 })
  }
}
