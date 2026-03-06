/**
 * GET /api/storefront/articles
 *
 * Returns published articles for storefront (blog list, blog carousel).
 * Query: locale (da|en), limit, sort, fallback-locale.
 * Does not require auth (overrideAccess).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const locale = (searchParams.get('locale') ?? 'da') as 'da' | 'en'
    const fallbackLocale = (searchParams.get('fallback-locale') ?? 'da') as 'da' | 'en'
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '10', 10) || 10, 50)
    const sort = searchParams.get('sort') ?? '-publishedAt'

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'articles',
      locale,
      fallbackLocale,
      depth: 1,
      limit,
      sort,
      where: {
        status: { equals: 'published' },
      },
      overrideAccess: true,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch articles'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
