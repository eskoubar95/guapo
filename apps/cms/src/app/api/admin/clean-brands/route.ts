/**
 * POST /api/admin/clean-brands
 * Clears all brands in Payload (and product brand refs). Use for fresh sync from Medusa.
 * Requires CLEAN_BRANDS_SECRET header or ?secret=... (set in .env).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Set CLEAN_BRANDS_SECRET in .env for production; dev defaults to 'dev-clean-brands' */
const SECRET = process.env.CLEAN_BRANDS_SECRET ?? 'dev-clean-brands'

export async function POST(req: Request) {
  const auth =
    req.headers.get('x-clean-brands-secret') === SECRET ||
    new URL(req.url).searchParams.get('secret') === SECRET
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const { docs: brands } = await payload.find({
      collection: 'brands',
      limit: 1000,
      overrideAccess: true,
    })

    if (brands.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'No brands to delete.' })
    }

    const brandIds = brands.map((b) => b.id)

    const { docs: products } = await payload.find({
      collection: 'products',
      where: { 'specifications.brand': { in: brandIds } },
      limit: 1000,
      overrideAccess: true,
    })

    let cleared = 0
    for (const p of products) {
      const spec = (p as { specifications?: { brand?: unknown } }).specifications
      if (spec?.brand) {
        await payload.update({
          collection: 'products',
          id: p.id,
          data: { specifications: { ...spec, brand: null } },
          overrideAccess: true,
        })
        cleared++
      }
    }

    for (const b of brands) {
      await payload.delete({
        collection: 'brands',
        id: b.id,
        overrideAccess: true,
      })
    }

    return NextResponse.json({
      ok: true,
      deleted: brands.length,
      productRefsCleared: cleared,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clean failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
