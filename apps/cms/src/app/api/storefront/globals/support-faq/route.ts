/**
 * GET /api/storefront/globals/support-faq
 *
 * Public FAQ content for storefront /support/faq (page copy + JSON-LD).
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

    const payload = await getPayload({ config })
    const result = await payload.findGlobal({
      slug: 'support-faq',
      locale,
      depth: 0,
    })

    const pageTitle = typeof result.pageTitle === 'string' ? result.pageTitle : null
    const categories = result.categories ?? null

    return NextResponse.json(
      { pageTitle, categories },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=120',
        },
      },
    )
  } catch (err) {
    console.error('[support-faq] GET failed', err)
    return NextResponse.json({ error: 'Failed to fetch FAQ content' }, { status: 500 })
  }
}
