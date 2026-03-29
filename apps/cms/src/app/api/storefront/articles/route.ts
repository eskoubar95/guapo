/**
 * GET /api/storefront/articles
 *
 * Returns published articles for storefront (blog list, blog carousel, search).
 * Query: locale (da|en), limit, sort, fallback-locale, q (optional search term).
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
    const locale = normalizeLocale(searchParams.get('locale'))
    const fallbackLocale = normalizeLocale(searchParams.get('fallback-locale'))
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '10', 10) || 10, 50)
    const page = Math.max(Number.parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
    const sort = searchParams.get('sort') ?? '-publishedAt'
    const q = searchParams.get('q')?.trim()

    const payload = await getPayload({ config })
    const statusFilter: Where = { status: { equals: 'published' } }
    const baseWhere: Where =
      q && q.length > 0
        ? {
            and: [
              statusFilter,
              {
                or: [{ title: { contains: q } }, { excerpt: { contains: q } }],
              },
            ],
          }
        : statusFilter

    const result = await payload.find({
      collection: 'articles',
      locale,
      fallbackLocale,
      depth: 1,
      limit,
      page,
      sort,
      where: baseWhere,
      overrideAccess: true,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch articles'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
