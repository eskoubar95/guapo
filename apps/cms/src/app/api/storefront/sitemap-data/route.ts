/**
 * GET /api/storefront/sitemap-data
 *
 * Published Pages + Articles for storefront sitemap.xml (no auth; overrideAccess).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const LOCALES = ['da', 'en'] as const

export interface SitemapPageRow {
  locale: (typeof LOCALES)[number]
  path: string
  updatedAt?: string | null
}

export interface SitemapArticleRow {
  locale: (typeof LOCALES)[number]
  slug: string
  updatedAt?: string | null
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const pages: SitemapPageRow[] = []
    const articles: SitemapArticleRow[] = []

    for (const locale of LOCALES) {
      let pageNum = 1
      const pageLimit = 200
      while (pageNum <= 50) {
        const result = await payload.find({
          collection: 'pages',
          where: { _status: { equals: 'published' } },
          locale,
          fallbackLocale: 'da',
          limit: pageLimit,
          page: pageNum,
          depth: 0,
          overrideAccess: true,
        })
        for (const doc of result.docs) {
          const path = typeof doc.path === 'string' ? doc.path.trim() : ''
          if (!path) continue
          const rawUpdated = doc.updatedAt as string | Date | undefined | null
          let updatedAt: string | null = null
          if (typeof rawUpdated === 'string') updatedAt = rawUpdated
          else if (rawUpdated && typeof (rawUpdated as Date).toISOString === 'function') {
            updatedAt = (rawUpdated as Date).toISOString()
          }
          pages.push({
            locale,
            path,
            updatedAt,
          })
        }
        if (!result.hasNextPage) break
        pageNum += 1
      }
    }

    for (const locale of LOCALES) {
      let pageNum = 1
      const articleLimit = 200
      while (pageNum <= 50) {
        const result = await payload.find({
          collection: 'articles',
          where: { status: { equals: 'published' } },
          locale,
          fallbackLocale: 'da',
          limit: articleLimit,
          page: pageNum,
          depth: 0,
          sort: '-publishedAt',
          overrideAccess: true,
        })
        for (const doc of result.docs) {
          const slug = typeof doc.slug === 'string' ? doc.slug.trim() : ''
          if (!slug) continue
          const rawArtUpdated = doc.updatedAt as string | Date | undefined | null
          let artUpdated: string | null = null
          if (typeof rawArtUpdated === 'string') artUpdated = rawArtUpdated
          else if (rawArtUpdated && typeof (rawArtUpdated as Date).toISOString === 'function') {
            artUpdated = (rawArtUpdated as Date).toISOString()
          }
          articles.push({
            locale,
            slug,
            updatedAt: artUpdated,
          })
        }
        if (!result.hasNextPage) break
        pageNum += 1
      }
    }

    return NextResponse.json(
      { pages, articles },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=120',
        },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to build sitemap data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
