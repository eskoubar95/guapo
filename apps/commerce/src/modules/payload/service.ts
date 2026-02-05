/**
 * Payload module service – calls Payload REST API from Medusa.
 * Aligned with Medusa official Payload integration (API key + is_from_medusa).
 */
import {
  PayloadModuleOptions,
  PayloadCollectionItem,
  PayloadUpsertData,
  PayloadQueryOptions,
  PayloadItemResult,
  PayloadApiResponse,
  PayloadBulkResult,
} from './types'
import { MedusaError } from '@medusajs/framework/utils'

type InjectedDependencies = Record<string, unknown>

export default class PayloadModuleService {
  private baseUrl: string
  private headers: Record<string, string>
  /** Query params sent with every request so Payload allows create/delete (official pattern) */
  private defaultQuery: Record<string, string> = { is_from_medusa: 'true' }

  constructor(container: InjectedDependencies, options: PayloadModuleOptions) {
    this.validateOptions(options)
    this.baseUrl = `${options.serverUrl.replace(/\/$/, '')}/api`
    this.headers = {
      'Content-Type': 'application/json',
    }
    if (options.syncSecret != null && options.syncSecret !== '') {
      this.headers['x-medusa-sync-secret'] = options.syncSecret
    } else if (options.apiKey) {
      this.headers['Authorization'] = `${options.userCollection ?? 'users'} API-Key ${options.apiKey}`
    }
  }

  private validateOptions(options: PayloadModuleOptions): void {
    if (!options.serverUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        'Payload server URL is required (PAYLOAD_SERVER_URL)',
      )
    }
    if (!options.apiKey && !options.syncSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        'Payload API key or sync secret is required (PAYLOAD_API_KEY or PAYLOAD_MEDUSA_SYNC_SECRET)',
      )
    }
  }

  private buildQuery(options: PayloadQueryOptions = {}): string {
    const merged: Record<string, string> = { ...this.defaultQuery }
    if (options.depth != null) merged.depth = String(options.depth)
    if (options.limit != null) merged.limit = String(options.limit)
    if (options.page != null) merged.page = String(options.page)
    if (options.sort != null) merged.sort = options.sort
    if (options.where != null) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
          const op = value as Record<string, unknown>
          Object.entries(op).forEach(([opKey, opVal]) => {
            if (opKey === 'in' && Array.isArray(opVal)) {
              merged[`where[${key}][in]`] = opVal.join(',')
            } else if (opVal != null) {
              merged[`where[${key}][${opKey}]`] = String(opVal)
            }
          })
        } else if (value != null) {
          merged[`where[${key}][equals]`] = String(value)
        }
      })
    }
    const search = new URLSearchParams(merged).toString()
    return search ? `?${search}` : ''
  }

  private async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...(options.headers as Record<string, string>) },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as PayloadApiResponse
        const mainMsg = errorData.message ?? errorData.errors?.[0]?.message ?? ''
        const details = (errorData.errors ?? [])
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join('; ')
        const fullMsg = details ? `${mainMsg}. Details: ${details}` : mainMsg
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Payload API error: ${response.status} ${response.statusText}. ${fullMsg}`,
        )
      }
      return (await response.json()) as T
    } catch (error) {
      if (error instanceof MedusaError) throw error
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to communicate with Payload: ${JSON.stringify(error)}`,
      )
    }
  }

  async create<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData,
    options: PayloadQueryOptions = {},
  ): Promise<PayloadItemResult<T>> {
    const query = this.buildQuery(options)
    const endpoint = `/${collection}${query}`
    const result = await this.makeRequest<PayloadItemResult<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return result
  }

  async update<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    data: PayloadUpsertData,
    options: PayloadQueryOptions = {},
  ): Promise<PayloadItemResult<T>> {
    const query = this.buildQuery(options)
    const endpoint = `/${collection}${query}`
    const result = await this.makeRequest<PayloadItemResult<T>>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return result
  }

  async delete(collection: string, options: PayloadQueryOptions = {}): Promise<PayloadApiResponse> {
    const query = this.buildQuery(options)
    const endpoint = `/${collection}${query}`
    const result = await this.makeRequest<PayloadApiResponse>(endpoint, { method: 'DELETE' })
    return result
  }

  async find<T extends PayloadCollectionItem = PayloadCollectionItem>(
    collection: string,
    options: PayloadQueryOptions = {},
  ): Promise<PayloadBulkResult<T>> {
    const query = this.buildQuery(options)
    const endpoint = `/${collection}${query}`
    const result = await this.makeRequest<PayloadBulkResult<T>>(endpoint)
    return result
  }
}
