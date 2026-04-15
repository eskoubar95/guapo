export type PaymentMethodChoice = "card" | "mobilepay" | "klarna";

export type GuapoCartLine = {
  title?: string | null;
  quantity?: number | null;
  total?: number | null;
  tax_total?: number | null;
  metadata?: Record<string, unknown> | null;
  variant?: { sku?: string | null } | null;
};

export type GuapoCartPayload = {
  id?: string;
  items?: GuapoCartLine[] | null;
  tax_total?: number | null;
  total?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
};
