export type WeightIntervalRow = {
  from_weight: number
  to_weight: number
  description?: string
}

export type OptionRow = {
  id: string
  name?: string
  type?: { code?: string }
  data?: {
    price_bands?: { max_grams: number; amount_minor: number }[]
    flat_amount_minor?: number
    product_code?: string
    service_codes?: string
    id?: string
    carrier_code?: string
    weight_intervals?: WeightIntervalRow[]
  }
}

export type PriceBand = { max_grams: number; amount_minor: number }

/** Shipmondo product row (normalized) in catalog wizard */
export type CatalogProductLite = {
  code: string
  name?: string
  carrier_code?: string
  service_point_product?: boolean
}

export type CatalogProductRich = CatalogProductLite & {
  required_services?: { code: string; name?: string }[]
  available_services?: { code: string; name?: string }[]
}

/** Row from GET /shipping_modules/carriers */
export type ApiCarrierOption = { code: string; name: string }
