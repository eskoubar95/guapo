import { NextResponse } from 'next/server'
import { fetchMedusaProductTypes } from '@/lib/medusa'

export async function GET() {
  try {
    const list = await fetchMedusaProductTypes()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
