/**
 * GET /api/storefront/pages
 *
 * Returns a single page by path for storefront consumption.
 * Query: path (required), locale (da|en), draft (true|false), fallback-locale (da|en).
 * Used for dynamic pages (home, landing, content) and Live Preview.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }
    const locale = (searchParams.get('locale') ?? 'da') as 'da' | 'en'
    const fallbackLocale = (searchParams.get('fallback-locale') ?? 'da') as 'da' | 'en'
    const draft = searchParams.get('draft') === 'true'

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'pages',
      where: { path: { equals: path } },
      locale,
      fallbackLocale,
      depth: 4,
      draft,
      limit: 1,
      overrideAccess: true,
    })

    const page = result.docs[0]
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }
    return NextResponse.json(page, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
