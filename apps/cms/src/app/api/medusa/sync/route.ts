/**
 * POST /api/medusa/sync
 *
 * Creates Payload documents for Medusa products, categories, and brands that
 * don't yet exist in Payload. Use this so editors see the same list in CMS as in commerce.
 * Run after adding new products/categories/brands in Medusa.
 *
 * In production, protect this route (e.g. cron secret or admin-only).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  fetchMedusaProducts,
  fetchMedusaCategories,
  fetchMedusaBrands,
} from '@/lib/medusa'

export async function POST() {
  try {
    const payload = await getPayload({ config })
    const results = { products: { created: 0, skipped: 0 }, categories: { created: 0, skipped: 0 }, brands: { created: 0, skipped: 0 } }

    // Sync products
    const products = await fetchMedusaProducts()
    for (const p of products) {
      const existing = await payload.find({
        collection: 'products',
        where: { handle: { equals: p.handle } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        results.products.skipped += 1
        continue
      }
      await payload.create({
        collection: 'products',
        data: { handle: p.handle, title: p.title ?? p.handle },
        overrideAccess: true,
      })
      results.products.created += 1
    }

    // Sync categories
    const categories = await fetchMedusaCategories()
    for (const c of categories) {
      const existing = await payload.find({
        collection: 'categories',
        where: { handle: { equals: c.handle } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        results.categories.skipped += 1
        continue
      }
      await payload.create({
        collection: 'categories',
        data: { handle: c.handle, name: c.name ?? c.handle },
        overrideAccess: true,
      })
      results.categories.created += 1
    }

    // Sync brands (brandKey = handle, displayName = name from Medusa Brand module)
    const brands = await fetchMedusaBrands()
    for (const b of brands) {
      const existing = await payload.find({
        collection: 'brands',
        where: { brandKey: { equals: b.handle } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        results.brands.skipped += 1
        continue
      }
      await payload.create({
        collection: 'brands',
        data: { brandKey: b.handle, displayName: b.name },
        overrideAccess: true,
      })
      results.brands.created += 1
    }

    return NextResponse.json({
      ok: true,
      message: 'Sync complete. Create Products/Categories/Brands in Payload from Medusa.',
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
