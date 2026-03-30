/**
 * GET /api/storefront/articles/by-slug?slug=...&locale=da
 *
 * Returns a single published article for storefront (article detail page).
 * Query: slug (required), locale, fallback-locale.
 * Does not require auth (overrideAccess).
 */
import { NextResponse } from 'next/server'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'

const VALID_LOCALES = ['da', 'en'] as const
type SupportedLocale = (typeof VALID_LOCALES)[number]

const normalizeLocale = (value: string | null): SupportedLocale =>
  value && VALID_LOCALES.includes(value as SupportedLocale) ? (value as SupportedLocale) : 'da'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')?.trim()
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    }

    const locale = normalizeLocale(searchParams.get('locale'))
    const fallbackLocale = normalizeLocale(searchParams.get('fallback-locale'))
    const draft = searchParams.get('draft') === 'true'

    const payload = await getPayload({ config })
    const where: Where = draft
      ? { slug: { equals: slug } }
      : { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] }

    const result = await payload.find({
      collection: 'articles',
      locale,
      fallbackLocale,
      depth: 2,
      limit: 1,
      draft,
      overrideAccess: true,
      where,
    })

    const doc = result.docs?.[0]
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(doc, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch article'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
