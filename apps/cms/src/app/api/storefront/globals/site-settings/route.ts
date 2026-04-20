/**
 * GET /api/storefront/globals/site-settings
 *
 * Returns public site settings for the storefront (favicon, touch icon, enabled locales).
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

    const payload = await getPayload({ config })
    const result = await payload.findGlobal({
      slug: 'site-settings',
      locale,
      fallbackLocale,
      depth: 1,
    })

    const rawLocales = result.enabledStorefrontLocales
    const enabledStorefrontLocales = Array.isArray(rawLocales)
      ? (rawLocales as string[]).filter((c): c is 'da' | 'en' =>
          c === 'da' || c === 'en',
        )
      : ['da']
    const normalizedLocales =
      enabledStorefrontLocales.includes('da') ? enabledStorefrontLocales : ['da', ...enabledStorefrontLocales]

    const publicResult = {
      favicon: result.favicon ?? null,
      appleTouchIcon: result.appleTouchIcon ?? null,
      enabledStorefrontLocales: normalizedLocales,
    }

    return NextResponse.json(publicResult, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[site-settings] GET failed', err)
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 })
  }
}
