/**
 * GET /api/storefront/globals/homepage
 *
 * Returns the Homepage global for storefront consumption.
 * Query: locale (da|en), draft (true|false), fallback-locale (da|en).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const VALID_LOCALES = ['da', 'en'] as const
type SupportedLocale = (typeof VALID_LOCALES)[number]

const normalizeLocale = (value: string | null): SupportedLocale =>
  value && VALID_LOCALES.includes(value as SupportedLocale) ? (value as SupportedLocale) : 'da'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const locale = normalizeLocale(searchParams.get('locale'))
    const fallbackLocale = normalizeLocale(searchParams.get('fallback-locale'))
    const draft = searchParams.get('draft') === 'true'

    const payload = await getPayload({ config })
    const result = await payload.findGlobal({
      slug: 'homepage',
      locale,
      fallbackLocale,
      depth: 4,
      draft,
      overrideAccess: true,
    })

    const headers = draft
      ? { 'Cache-Control': 'no-store' }
      : { 'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60' }

    return NextResponse.json(result, { status: 200, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch homepage'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
