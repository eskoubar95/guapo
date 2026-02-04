import { NextResponse } from 'next/server'
import { fetchMedusaProducts } from '@/lib/medusa'

export async function GET() {
  try {
    const list = await fetchMedusaProducts()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
