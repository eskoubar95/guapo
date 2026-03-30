/**
 * GET /api/storefront/globals/footer
 *
 * Returns the Footer global for storefront (columns, newsletter, copyright, socialLinks).
 * Query: locale (da|en), draft (true|false), fallback-locale (da|en).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const locale = (searchParams.get('locale') ?? 'da') as 'da' | 'en'
    const fallbackLocale = (searchParams.get('fallback-locale') ?? 'da') as 'da' | 'en'
    const draft = searchParams.get('draft') === 'true'

    const payload = await getPayload({ config })
    const result = await payload.findGlobal({
      slug: 'footer',
      locale,
      fallbackLocale,
      depth: 2,
      draft,
      overrideAccess: true,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch footer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
