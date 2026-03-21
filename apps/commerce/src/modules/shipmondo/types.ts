/** Weight-based price band: up to max_grams (inclusive) use amount_minor. */
export type ShipmondoPriceBand = { max_grams: number; amount_minor: number };

/** Weight interval from Shipmondo product (from_weight/to_weight in grams). */
export type ShipmondoWeightInterval = {
  from_weight: number;
  to_weight: number;
  description?: string;
};

/** Product from Shipmondo GET /products (country_code=DK). */
export type ShipmondoProduct = {
  code: string;
  name?: string;
  service_point_product?: boolean;
  carrier_code?: string;
  weight_intervals?: ShipmondoWeightInterval[];
};

export type ShipmondoOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};
