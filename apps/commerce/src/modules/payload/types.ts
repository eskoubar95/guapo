/**
 * Payload module types – aligned with Medusa official Payload integration.
 * Used when calling Payload REST API from Medusa (create/update/delete/find).
 */

export interface PayloadModuleOptions {
  serverUrl: string
  apiKey: string
  userCollection?: string
  /** Optional: send this header so Payload allows create/delete (alternative to query is_from_medusa) */
  syncSecret?: string
}

export interface PayloadCollectionItem {
  id: string
  createdAt?: string
  updatedAt?: string
  medusa_id?: string
  handle?: string
  [key: string]: unknown
}

export interface PayloadUpsertData {
  [key: string]: unknown
}

export interface PayloadQueryOptions {
  depth?: number
  locale?: string
  fallbackLocale?: string
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, unknown>
}

export interface PayloadItemResult<T = PayloadCollectionItem> {
  doc: T
  message?: string
}

export interface PayloadApiResponse<T = unknown> {
  docs?: T[]
  totalDocs?: number
  limit?: number
  page?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
  message?: string
  errors?: Array<{ message: string; field?: string }>
}

export interface PayloadBulkResult<T = PayloadCollectionItem> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
  pagingCounter: number
}
