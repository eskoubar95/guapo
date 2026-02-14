import { NextResponse } from 'next/server'
import { fetchMedusaCategories } from '@/lib/medusa'

export async function GET() {
  try {
    const list = await fetchMedusaCategories()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
