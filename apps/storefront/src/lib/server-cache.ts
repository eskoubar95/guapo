/**
 * Short-lived in-process cache for server-side fetch helpers (Medusa, Payload).
 * Complements Next.js `revalidate` — dedupes repeated work within the same Node process.
 */

const CACHE_TTL_MS = 60 * 1000;
const MAX_ENTRIES_SOFT = 500;
const cache = new Map<string, { data: unknown; expires: number }>();

function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expires) cache.delete(key);
  }
}

function maybePruneAfterRead(): void {
  if (cache.size > MAX_ENTRIES_SOFT) {
    pruneExpiredEntries();
  }
}

/** Use when cached value may be `null` and must be distinguished from a cache miss. */
export type CacheReadResult<T> = { hit: true; value: T } | { hit: false };

export function readCache<T>(key: string): CacheReadResult<T> {
  const entry = cache.get(key);
  if (!entry) return { hit: false };
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return { hit: false };
  }
  maybePruneAfterRead();
  return { hit: true, value: entry.data as T };
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  maybePruneAfterRead();
  return entry.data as T;
}

export function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  if (cache.size > MAX_ENTRIES_SOFT) {
    pruneExpiredEntries();
  }
}
