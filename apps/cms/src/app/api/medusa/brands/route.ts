import { NextResponse } from 'next/server'
import { fetchMedusaBrands } from '@/lib/medusa'

export async function GET() {
  try {
    const list = await fetchMedusaBrands()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
