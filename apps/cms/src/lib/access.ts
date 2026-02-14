/**
 * Shared access control helpers for Medusa sync.
 * Used by Products, Categories, Brands, ProductTypes collections.
 */

/**
 * Allow create/delete only when request is from Medusa sync (official integration pattern).
 * In production: requires x-medusa-sync-secret header.
 * In development: also accepts ?is_from_medusa=true query param for local convenience.
 */
export function isFromMedusa(req: {
  query?: Record<string, unknown>
  headers?: { get?: (name: string) => string | null }
}): boolean {
  const secret = process.env.PAYLOAD_MEDUSA_SYNC_SECRET
  if (secret && req?.headers?.get?.('x-medusa-sync-secret') === secret) return true
  if (process.env.NODE_ENV === 'development') {
    const q = req?.query?.is_from_medusa
    if (q === true || q === 'true') return true
  }
  return false
}
