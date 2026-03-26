/** Weight-based price band: up to max_grams (inclusive) use amount_minor. */
export type ShipmondoPriceBand = { max_grams: number; amount_minor: number };

/** Weight interval from Shipmondo product (from_weight/to_weight in grams). */
export type ShipmondoWeightInterval = {
  from_weight: number;
  to_weight: number;
  description?: string;
};

/** Product from Shipmondo GET /products (normalized; `service_point_product` includes `service_point_required` from API). */
export type ShipmondoProduct = {
  code: string;
  name?: string;
  service_point_product?: boolean;
  carrier_code?: string;
  weight_intervals?: ShipmondoWeightInterval[];
  required_services?: Array<{ code: string; name?: string }>;
  available_services?: Array<{ code: string; name?: string }>;
};

export type ShipmondoOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};
