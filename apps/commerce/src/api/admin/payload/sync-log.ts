/**
 * In-memory log of last Payload sync per collection.
 * Used by Settings → Payload to show "Last synced: ...".
 * Resets on server restart.
 */
export const payloadSyncLastAt: Record<string, string> = {}

export const SYNC_COLLECTIONS = ['products', 'categories', 'brands', 'product_types'] as const
