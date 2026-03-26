export interface ShippingOption {
  id: string;
  name: string;
  amount?: number;
  /** Normalized lowercase from Medusa option `data.carrier_code` when present (e.g. gls, dao, pdk). */
  carrier_code?: string | null;
  /** Shipmondo product code from option `data.product_code` or legacy `data.id`. */
  product_code?: string | null;
}
