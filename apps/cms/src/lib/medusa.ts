/**
 * Medusa Store API client for CMS (server-side only).
 * Used by /api/medusa/* routes to proxy product, category, and brand data for admin dropdowns.
 * Set MEDUSA_STORE_URL in apps/cms/.env (e.g. http://localhost:9000).
 */

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const cache = new Map<
  string,
  { data: unknown; expires: number }
>()

function getBaseUrl(): string {
  const url = process.env.MEDUSA_STORE_URL?.trim()
  if (!url) return ''
  return url.replace(/\/$/, '')
}

function getCacheKey(key: string): string {
  return `medusa:${key}`
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(getCacheKey(key))
  if (!entry || Date.now() > entry.expires) return null
  return entry.data as T
}

function setCache(key: string, data: unknown): void {
  cache.set(getCacheKey(key), { data, expires: Date.now() + CACHE_TTL_MS })
}

export interface MedusaProductItem {
  handle: string
  title?: string
}

export interface MedusaCategoryItem {
  handle: string
  name?: string
}

/** GET /store/products and return { handle, title } for dropdowns */
export async function fetchMedusaProducts(): Promise<MedusaProductItem[]> {
  const base = getBaseUrl()
  if (!base) return []
  const cached = getCached<MedusaProductItem[]>('products')
  if (cached !== null) return cached
  try {
    const res = await fetch(
      `${base}/store/products?limit=250&fields=handle,title`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MEDUSA_PUBLISHABLE_API_KEY && {
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const json = (await res.json()) as { products?: Array<{ handle?: string; title?: string }> }
    const list = (json.products ?? []).map((p) => ({
      handle: p.handle ?? '',
      title: p.title,
    })).filter((p) => p.handle)
    setCache('products', list)
    return list
  } catch {
    return []
  }
}

/** GET /store/product-categories and return { handle, name } */
export async function fetchMedusaCategories(): Promise<MedusaCategoryItem[]> {
  const base = getBaseUrl()
  if (!base) return []
  const cached = getCached<MedusaCategoryItem[]>('categories')
  if (cached !== null) return cached
  try {
    const res = await fetch(
      `${base}/store/product-categories?limit=100&fields=handle,name`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MEDUSA_PUBLISHABLE_API_KEY && {
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const json = (await res.json()) as { product_categories?: Array<{ handle?: string; name?: string }> }
    const list = (json.product_categories ?? []).map((c) => ({
      handle: c.handle ?? '',
      name: c.name,
    })).filter((c) => c.handle)
    setCache('categories', list)
    return list
  } catch {
    return []
  }
}

/** Product types: from /store/product-types if available, else derive from products */
export async function fetchMedusaProductTypes(): Promise<string[]> {
  const base = getBaseUrl()
  if (!base) return []
  const cached = getCached<string[]>('product-types')
  if (cached !== null) return cached
  try {
    const res = await fetch(
      `${base}/store/product-types?limit=50&fields=value`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MEDUSA_PUBLISHABLE_API_KEY && {
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
        next: { revalidate: 300 },
      }
    )
    if (res.ok) {
      const json = (await res.json()) as { product_types?: Array<{ value?: string }> }
      const list = (json.product_types ?? [])
        .map((t) => t.value)
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
      setCache('product-types', list)
      return list
    }
  } catch {
    // fallthrough to products-based derivation
  }
  const types = new Set<string>()
  try {
    const res = await fetch(
      `${base}/store/products?limit=250&fields=*product_type.value`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MEDUSA_PUBLISHABLE_API_KEY && {
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
      }
    )
    if (res.ok) {
      const json = (await res.json()) as { products?: Array<{ product_type?: { value?: string } }> }
      for (const p of json.products ?? []) {
        const v = p.product_type?.value
        if (typeof v === 'string' && v) types.add(v)
      }
    }
  } catch {
    // ignore
  }
  const list = Array.from(types)
  setCache('product-types', list)
  return list
}

/** Brands: try GET /store/brands (custom commerce route) first, else aggregate from products metadata */
export async function fetchMedusaBrands(): Promise<string[]> {
  const base = getBaseUrl()
  if (!base) return []
  const cached = getCached<string[]>('brands')
  if (cached !== null) return cached
  try {
    const res = await fetch(`${base}/store/brands`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const json = (await res.json()) as { brands?: string[] }
      const list = Array.isArray(json.brands) ? json.brands.filter((b) => typeof b === 'string') : []
      setCache('brands', list)
      return list
    }
  } catch {
    // fallthrough
  }
  try {
    const res = await fetch(
      `${base}/store/products?limit=250&fields=metadata`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MEDUSA_PUBLISHABLE_API_KEY && {
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_API_KEY,
          }),
        },
      }
    )
    if (!res.ok) return []
    const json = (await res.json()) as { products?: Array<{ metadata?: Record<string, unknown> }> }
    const brands = new Set<string>()
    for (const p of json.products ?? []) {
      const b = p.metadata?.brand
      if (typeof b === 'string' && b.trim()) brands.add(b.trim())
    }
    const list = Array.from(brands)
    setCache('brands', list)
    return list
  } catch {
    return []
  }
}

/**
 * Check if a product handle exists in Medusa (for Payload create validation).
 * Returns true if key exists, false if not.
 * Returns true if Medusa list is empty (fail-open: skip validation when Medusa unavailable to avoid blocking CMS).
 */
export async function medusaProductHandleExists(handle: string | undefined): Promise<boolean> {
  if (!handle || !handle.trim()) return false
  const list = await fetchMedusaProducts()
  if (list.length === 0) {
    console.warn(
      `[medusa] Medusa appears unavailable (empty product list); validation skipped for handle "${handle}"`,
    )
    return true
  }
  return list.some((p) => p.handle === handle.trim())
}

/**
 * Check if a category handle exists in Medusa.
 * Returns true if key exists, false if not.
 * Returns true if Medusa list is empty (fail-open: skip validation when Medusa unavailable).
 */
export async function medusaCategoryHandleExists(handle: string | undefined): Promise<boolean> {
  if (!handle || !handle.trim()) return false
  const list = await fetchMedusaCategories()
  if (list.length === 0) return true // fail-open: avoid blocking CMS when Medusa unavailable
  return list.some((c) => c.handle === handle.trim())
}

export async function medusaBrandKeyExists(brandKey: string | undefined): Promise<boolean> {
  if (!brandKey || !brandKey.trim()) return false
  const list = await fetchMedusaBrands()
  if (list.length === 0) return true
  return list.some((b) => b === brandKey.trim())
}

export async function medusaProductTypeValueExists(value: string | undefined): Promise<boolean> {
  if (!value || !value.trim()) return false
  const list = await fetchMedusaProductTypes()
  if (list.length === 0) return true
  return list.some((v) => v === value.trim())
}
