import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import type {
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
} from "@medusajs/types";
import type { Logger } from "@medusajs/framework/types";
import { Client } from "pg";

const DEFAULT_FLAT_RATE_MINOR = 3900; // 39 DKK in minor units
const PRODUCTS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const ENABLED_PRODUCTS_CACHE_TTL_MS = 60 * 1000; // 1 minute
const CART_WEIGHT_CACHE_TTL_MS = 4000;
const DEFAULT_WEIGHT_GRAMS_PER_ITEM = 500;
const MIN_PARCEL_WEIGHT_GRAMS = 200;
const MAX_PARCEL_WEIGHT_GRAMS = 30000;
const DEFAULT_TOTAL_WEIGHT_GRAMS = 2000;
const DEFAULT_SERVICE_CODES = "EMAIL_NT";

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

/** Fallback option ids when API is unavailable (legacy). */
const FALLBACK_OPTION_IDS = ["gls-pakkeshop", "dao-pakkeshop"] as const;
const FALLBACK_PRODUCT_CODES: Record<string, string> = {
  "gls-pakkeshop": "GLSDK_SD",
  "dao-pakkeshop": "DAO_SD",
};

const FIXED_CARRIER_LABELS: Record<string, string> = {
  GLSDK_SD: "GLS Pakkeshop",
  DAO_SD: "DAO Pakkeshop",
};

/**
 * Fixed checkout carriers (comma-separated Shipmondo product codes).
 * Default: GLS, DAO, PostNord (POSTDK_SD – verify in Shipmondo). Set SHIPMONDO_CHECKOUT_CARRIER_CODES=__API__ for dynamic GET /products + enabled table.
 */
function getFixedCheckoutCarrierOptions(): FulfillmentOption[] | null {
  const trimmed = process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES?.trim();
  if (trimmed === "__API__") return null;
  const postnordDefault = process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE?.trim() || "POSTDK_SD";
  const codes = (trimmed || `GLSDK_SD,DAO_SD,${postnordDefault}`).split(/[\s,]+/).filter(Boolean);
  if (codes.length === 0) return null;
  const postnordCode = process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE?.trim();
  return codes.map((code) => {
    let name = FIXED_CARRIER_LABELS[code];
    if (!name && postnordCode && code === postnordCode) name = "PostNord Pakkeshop";
    if (!name && (/^(POST|PDK|PN)/i.test(code) || /postnord/i.test(code))) name = "PostNord Pakkeshop";
    if (!name) name = code;
    return { id: code, name };
  });
}

export type ShipmondoOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

/** Parse weight_intervals from API response (from_weight, to_weight, description). */
function parseWeightIntervals(raw: unknown): ShipmondoWeightInterval[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ShipmondoWeightInterval[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const from = Number(o.from_weight);
    const to = Number(o.to_weight);
    if (!Number.isNaN(from) && !Number.isNaN(to) && from >= 0 && to >= 0) {
      out.push({
        from_weight: Math.round(from),
        to_weight: Math.round(to),
        description: typeof o.description === "string" ? o.description : undefined,
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

/** Normalize raw product from API to ShipmondoProduct (incl. weight_intervals). */
function normalizeProduct(
  p: Record<string, unknown> & { code: string; service_point_product: boolean }
): ShipmondoProduct {
  const product: ShipmondoProduct = {
    code: p.code,
    service_point_product: p.service_point_product,
    name: typeof p.name === "string" ? p.name : undefined,
    carrier_code: typeof p.carrier_code === "string" ? p.carrier_code : undefined,
  };
  const intervals = parseWeightIntervals(p.weight_intervals);
  if (intervals?.length) product.weight_intervals = intervals;
  return product;
}

/** In-memory cache for products list (per module instance). */
let productsCache: { products: ShipmondoProduct[]; expiresAt: number } | null = null;

/** Cache for enabled product codes from DB (null = not loaded or error = return all). */
let enabledProductCodesCache: { codes: string[] | null; expiresAt: number } | null = null;

class ShipmondoFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shipmondo";

  protected logger_: Logger;
  protected options_: ShipmondoOptions;
  protected baseUrl_: string;
  /** Short-lived cache: cart_id → total grams (avoids N DB hits per carrier when context.items is missing). */
  private cartWeightGramsCache_ = new Map<string, { grams: number; expiresAt: number }>();

  constructor(
    { logger }: InjectedDependencies,
    options: ShipmondoOptions
  ) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.baseUrl_ = getBaseUrl(!!options.sandbox);
  }

  /**
   * Read enabled product codes from medusa.shipmondo_enabled_products.
   * Returns null on error or missing table (caller should return all products); empty array when table is empty; otherwise list of codes.
   * Result is cached for ENABLED_PRODUCTS_CACHE_TTL_MS.
   */
  private async getEnabledProductCodes(): Promise<string[] | null> {
    const now = Date.now();
    if (enabledProductCodesCache && enabledProductCodesCache.expiresAt > now) {
      return enabledProductCodesCache.codes;
    }
    const url = process.env.DATABASE_URL;
    if (!url || typeof url !== "string") {
      enabledProductCodesCache = { codes: null, expiresAt: now + ENABLED_PRODUCTS_CACHE_TTL_MS };
      return null;
    }
    let client: Client | null = null;
    try {
      client = new Client({ connectionString: url });
      await client.connect();
      const res = await client.query<{ product_code: string }>({
        text: `SELECT product_code FROM medusa.shipmondo_enabled_products WHERE enabled = true ORDER BY display_order ASC NULLS LAST, product_code`,
      });
      const codes = res.rows.map((r: { product_code: string }) => r.product_code).filter(Boolean);
      enabledProductCodesCache = { codes, expiresAt: now + ENABLED_PRODUCTS_CACHE_TTL_MS };
      return codes;
    } catch (e) {
      this.logger_.debug(
        `Shipmondo getEnabledProductCodes failed: ${e instanceof Error ? e.message : String(e)}; returning all products`
      );
      enabledProductCodesCache = { codes: null, expiresAt: now + ENABLED_PRODUCTS_CACHE_TTL_MS };
      return null;
    } finally {
      await client?.end().catch(() => {});
    }
  }

  /**
   * Fetch shipping products from Shipmondo API (DK), filter service_point products.
   * Uses shared cache with TTL. Falls back to empty array on error.
   */
  private async fetchProducts(): Promise<ShipmondoProduct[]> {
    const now = Date.now();
    if (productsCache && productsCache.expiresAt > now) {
      return productsCache.products;
    }
    if (!this.options_.apiUser || !this.options_.apiKey) {
      return [];
    }
    try {
      const raw = await this.request<ShipmondoProduct[] | { products?: ShipmondoProduct[] }>(
        "GET",
        "/products?country_code=DK"
      );
      const list = Array.isArray(raw) ? raw : raw?.products ?? [];
      const products = list
        .filter(
          (p): p is Record<string, unknown> & { code: string; service_point_product: boolean } =>
            typeof p?.code === "string" && p.service_point_product === true
        )
        .map((p) => normalizeProduct(p));
      productsCache = { products, expiresAt: now + PRODUCTS_CACHE_TTL_MS };
      return products;
    } catch (e) {
      this.logger_.warn(
        `Shipmondo fetchProducts failed: ${e instanceof Error ? e.message : String(e)}; using fallback options`
      );
      return [];
    }
  }

  /** Resolve product code from option id (from API) or legacy id (gls-pakkeshop/dao-pakkeshop). */
  private resolveProductCode(optionId: string | undefined): string {
    if (!optionId) return FALLBACK_PRODUCT_CODES["gls-pakkeshop"];
    if (FALLBACK_PRODUCT_CODES[optionId]) return FALLBACK_PRODUCT_CODES[optionId];
    return optionId; // assume id is product code when from API
  }

  /** Get flat rate in minor units from env or default. */
  private getFlatRateMinor(): number {
    const env = process.env.SHIPMONDO_FLAT_RATE_MINOR;
    if (env != null && env !== "") {
      const n = Number(env);
      if (!Number.isNaN(n) && n >= 0) return Math.round(n);
    }
    return DEFAULT_FLAT_RATE_MINOR;
  }

  /** Parse weight-based price bands from SHIPMONDO_PRICE_BANDS (JSON array). Sorted by max_grams asc. */
  private getPriceBands(): ShipmondoPriceBand[] {
    const raw = process.env.SHIPMONDO_PRICE_BANDS;
    if (raw == null || raw === "") return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      const bands: ShipmondoPriceBand[] = parsed
        .filter(
          (b): b is ShipmondoPriceBand =>
            typeof b === "object" &&
            b != null &&
            typeof (b as ShipmondoPriceBand).max_grams === "number" &&
            typeof (b as ShipmondoPriceBand).amount_minor === "number"
        )
        .map((b) => ({ max_grams: Math.max(0, b.max_grams), amount_minor: Math.max(0, Math.round(b.amount_minor)) }));
      return bands.sort((a, b) => a.max_grams - b.max_grams);
    } catch {
      return [];
    }
  }

  /** Resolve price from bands array (sorted by max_grams). Returns amount_minor or null if no match. */
  private priceFromBands(weightGrams: number, bands: ShipmondoPriceBand[]): number | null {
    if (!Array.isArray(bands) || bands.length === 0) return null;
    for (const band of bands) {
      if (
        typeof band.max_grams === "number" &&
        typeof band.amount_minor === "number" &&
        weightGrams <= band.max_grams
      ) {
        return Math.max(0, Math.round(band.amount_minor));
      }
    }
    const last = bands[bands.length - 1];
    return typeof last?.amount_minor === "number" ? Math.max(0, Math.round(last.amount_minor)) : null;
  }

  private parsePriceBandsArray(raw: unknown): ShipmondoPriceBand[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (b): b is ShipmondoPriceBand =>
          typeof b === "object" &&
          b != null &&
          typeof (b as ShipmondoPriceBand).max_grams === "number" &&
          typeof (b as ShipmondoPriceBand).amount_minor === "number"
      )
      .map((b) => ({ max_grams: Math.max(0, b.max_grams), amount_minor: Math.max(0, Math.round(b.amount_minor)) }));
  }

  /**
   * Price bands from shipping option JSON (Admin / seed / sync).
   * Supports: data.price_bands, top-level price_bands, stringified data JSON.
   */
  private getPriceBandsFromOptionData(optionData: Record<string, unknown> | undefined): ShipmondoPriceBand[] {
    if (!optionData || typeof optionData !== "object") return [];
    const chunks: ShipmondoPriceBand[] = [];
    const dataVal = optionData.data;
    if (dataVal && typeof dataVal === "object" && dataVal !== null) {
      chunks.push(...this.parsePriceBandsArray((dataVal as Record<string, unknown>).price_bands));
    }
    if (typeof dataVal === "string") {
      try {
        const parsed = JSON.parse(dataVal) as Record<string, unknown>;
        chunks.push(...this.parsePriceBandsArray(parsed.price_bands));
        const inner = parsed.data;
        if (inner && typeof inner === "object" && inner !== null) {
          chunks.push(...this.parsePriceBandsArray((inner as Record<string, unknown>).price_bands));
        }
      } catch {
        /* ignore */
      }
    }
    chunks.push(...this.parsePriceBandsArray(optionData.price_bands));
    if (chunks.length === 0) return [];
    const byMax = new Map<number, ShipmondoPriceBand>();
    for (const b of chunks) {
      byMax.set(b.max_grams, b);
    }
    return Array.from(byMax.values()).sort((a, b) => a.max_grams - b.max_grams);
  }

  /** Flat fallback from option JSON (root or nested data). */
  private getFlatAmountFromOption(optionData: Record<string, unknown> | undefined): number | null {
    if (!optionData) return null;
    const nested = optionData.data;
    if (nested && typeof nested === "object" && nested !== null) {
      const n = (nested as Record<string, unknown>).flat_amount_minor;
      if (typeof n === "number" && !Number.isNaN(n) && n >= 0) return Math.round(n);
    }
    if (typeof optionData.flat_amount_minor === "number" && optionData.flat_amount_minor >= 0) {
      return Math.round(optionData.flat_amount_minor);
    }
    if (typeof optionData.amount_minor === "number" && optionData.amount_minor >= 0) {
      return Math.round(optionData.amount_minor);
    }
    return null;
  }

  /** Resolve price in minor units: by weight bands if available, else flat rate. Env fallback only. */
  private getPriceForWeightGrams(weightGrams: number, bandsFromOption?: ShipmondoPriceBand[]): number {
    const bands =
      bandsFromOption?.length ? bandsFromOption : this.getPriceBands();
    const fromBands = this.priceFromBands(weightGrams, bands);
    if (fromBands !== null) return fromBands;
    return this.getFlatRateMinor();
  }

  /** Total weight in grams from cart/context items (variant weight or default per item). */
  private getWeightFromContext(context: Record<string, unknown> | undefined): number {
    if (!context || typeof context !== "object") return 0;
    type ItemRow = { quantity?: number; variant?: { weight?: number }; weight?: number };
    let items = context.items as ItemRow[] | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      const cart = context.cart as { items?: ItemRow[] } | undefined;
      if (Array.isArray(cart?.items) && cart.items.length > 0) items = cart.items;
    }
    if (!Array.isArray(items) || items.length === 0) {
      const lineItems = context.line_items as ItemRow[] | undefined;
      if (Array.isArray(lineItems) && lineItems.length > 0) items = lineItems;
    }
    if (!Array.isArray(items) || items.length === 0) return 0;
    let total = 0;
    for (const i of items) {
      const qty = typeof i?.quantity === "number" && i.quantity > 0 ? i.quantity : 1;
      const w = i?.weight ?? i?.variant?.weight;
      const grams = typeof w === "number" && w >= 0 ? w : DEFAULT_WEIGHT_GRAMS_PER_ITEM;
      total += qty * grams;
    }
    return total;
  }

  private async getCartWeightGramsFromDb(cartId: string): Promise<number> {
    if (process.env.SHIPMONDO_SKIP_CART_WEIGHT_DB === "true") return 0;
    const url = process.env.DATABASE_URL;
    if (!url || typeof url !== "string") return 0;
    const schema = (process.env.DATABASE_SCHEMA || "medusa").trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) return 0;
    let client: Client | null = null;
    try {
      client = new Client({ connectionString: url });
      await client.connect();
      const res = await client.query<{ quantity: unknown; weight: unknown }>({
        text: `SELECT cli.quantity, pv.weight
FROM "${schema}".cart_line_item cli
LEFT JOIN "${schema}".product_variant pv ON pv.id = cli.variant_id AND pv.deleted_at IS NULL
WHERE cli.cart_id = $1 AND cli.deleted_at IS NULL AND COALESCE(cli.requires_shipping, true) = true`,
        values: [cartId],
      });
      let total = 0;
      for (const row of res.rows) {
        const qty = Number(row.quantity);
        const q = Number.isFinite(qty) && qty > 0 ? qty : 1;
        const w = row.weight != null ? Number(row.weight) : NaN;
        const grams = Number.isFinite(w) && w > 0 ? w : DEFAULT_WEIGHT_GRAMS_PER_ITEM;
        total += q * grams;
      }
      return total;
    } catch (e) {
      this.logger_.debug(
        `Shipmondo getCartWeightGramsFromDb failed: ${e instanceof Error ? e.message : String(e)}`
      );
      return 0;
    } finally {
      await client?.end().catch(() => {});
    }
  }

  private async resolveWeightGramsForPricing(
    context: Record<string, unknown> | undefined
  ): Promise<number> {
    let grams = this.getWeightFromContext(context);
    if (grams > 0) return grams;
    const id = context?.id;
    if (typeof id !== "string" || !id.startsWith("cart_")) return 0;
    const now = Date.now();
    const hit = this.cartWeightGramsCache_.get(id);
    if (hit && hit.expiresAt > now) return hit.grams;
    grams = await this.getCartWeightGramsFromDb(id);
    this.cartWeightGramsCache_.set(id, { grams, expiresAt: now + CART_WEIGHT_CACHE_TTL_MS });
    return grams;
  }

  /** Total weight in grams from fulfillment items (variant weight or default per item). */
  private getTotalWeightGrams(items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[]): number {
    let total = 0;
    for (const i of items) {
      const qty = (i as { quantity?: number }).quantity ?? 1;
      const itemWithVariant = i as { variant?: { weight?: number }; weight?: number };
      const weight =
        itemWithVariant.weight ??
        itemWithVariant.variant?.weight ??
        DEFAULT_WEIGHT_GRAMS_PER_ITEM;
      total += qty * (typeof weight === "number" && weight >= 0 ? weight : DEFAULT_WEIGHT_GRAMS_PER_ITEM);
    }
    if (total <= 0) return DEFAULT_TOTAL_WEIGHT_GRAMS;
    return Math.min(Math.max(total, MIN_PARCEL_WEIGHT_GRAMS), MAX_PARCEL_WEIGHT_GRAMS);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl_}${path}`;
    const auth = Buffer.from(
      `${this.options_.apiUser}:${this.options_.apiKey}`
    ).toString("base64");
    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      const text = await res.text();
      const safeMsg = text.slice(0, 300);
      this.logger_.warn(`Shipmondo API ${method} ${path}: ${res.status}`);
      throw new Error(`Shipmondo API error: ${res.status} ${safeMsg}`);
    }
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const fixed = getFixedCheckoutCarrierOptions();
    if (fixed) return fixed;

    let products = await this.fetchProducts();
    const enabledCodes = await this.getEnabledProductCodes();
    if (enabledCodes !== null && enabledCodes.length > 0) {
      products = products.filter((p) => enabledCodes.includes(p.code));
    }
    if (products.length > 0) {
      return products.map((p) => ({ id: p.code, ...(p.name && { name: p.name }) }));
    }
    return FALLBACK_OPTION_IDS.map((id) => ({ id }));
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    const id = typeof data?.id === "string" ? data.id : undefined;
    if (!id) return false;
    const fixed = getFixedCheckoutCarrierOptions();
    if (fixed) return fixed.some((o) => o.id === id);
    if (FALLBACK_OPTION_IDS.includes(id as (typeof FALLBACK_OPTION_IDS)[number])) return true;
    const products = await this.fetchProducts();
    return products.some((p) => p.code === id);
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const servicePointId = data?.service_point_id ?? optionData?.service_point_id;
    if (typeof servicePointId !== "string" || !servicePointId) {
      return data;
    }
    return { ...data, service_point_id: servicePointId };
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  /**
   * Calculate shipping price. Primary source: option.data (Admin) – price_bands or flat_amount_minor.
   * Fallback: optionData.amount_minor / data.amount_minor, then env SHIPMONDO_PRICE_BANDS / SHIPMONDO_FLAT_RATE_MINOR.
   */
  async calculatePrice(
    optionData?: Record<string, unknown>,
    data?: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<CalculatedShippingOptionPrice> {
    const flatFromOption =
      this.getFlatAmountFromOption(optionData) ??
      (typeof data?.amount_minor === "number" && data.amount_minor >= 0
        ? Math.round(data.amount_minor)
        : null);

    const bandsFromOption = this.getPriceBandsFromOptionData(optionData);
    const weightGrams = await this.resolveWeightGramsForPricing(context);

    if (bandsFromOption.length > 0 && weightGrams > 0) {
      const fromBands = this.priceFromBands(weightGrams, bandsFromOption);
      if (fromBands !== null) {
        return { calculated_amount: fromBands, is_calculated_price_tax_inclusive: true };
      }
    }
    if (flatFromOption !== null) {
      return { calculated_amount: flatFromOption, is_calculated_price_tax_inclusive: true };
    }
    const amount =
      weightGrams > 0
        ? this.getPriceForWeightGrams(weightGrams, bandsFromOption.length ? bandsFromOption : undefined)
        : this.getFlatRateMinor();
    return {
      calculated_amount: amount,
      is_calculated_price_tax_inclusive: true,
    };
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    const servicePointId = data?.service_point_id as string | undefined;
    const optionId = (fulfillment as { shipping_option_id?: string })?.shipping_option_id;
    const productCode =
      (data?.product_code as string) ??
      (fulfillment as { option?: { data?: { product_code?: string } } })?.option?.data?.product_code ??
      this.resolveProductCode(optionId);
    const optionData = (fulfillment as { option?: { data?: { service_codes?: string } } })?.option?.data;
    const serviceCodes =
      (data?.service_codes as string) ??
      optionData?.service_codes ??
      process.env.SHIPMONDO_SERVICE_CODES ??
      DEFAULT_SERVICE_CODES;

    // Dry-run: simulate fulfillment without calling Shipmondo (no real labels, no cost)
    if (process.env.SHIPMONDO_DRY_RUN === "true") {
      this.logger_.info(
        `Shipmondo dry-run: would create shipment (product=${productCode}, service_point=${servicePointId ?? "auto"})`
      );
      return {
        data: {
          dry_run: true,
          service_point_id: servicePointId,
          product_code: productCode,
          order_id: order?.id,
        },
        labels: [{ tracking_number: "DRY-RUN", tracking_url: "", label_url: "" }],
      };
    }

    if (!this.options_.apiUser || !this.options_.apiKey) {
      this.logger_.warn("Shipmondo API credentials not set; skipping label creation");
      return {
        data: { skipped: true, reason: "no_credentials" },
        labels: [],
      };
    }

    const orderId = order?.id ?? "unknown";
    const totalWeight = this.getTotalWeightGrams(items);

    const sender = {
      type: "sender",
      name: process.env.SHIPMONDO_SENDER_NAME ?? "Guapo",
      address1: process.env.SHIPMONDO_SENDER_ADDRESS ?? "",
      postal_code: process.env.SHIPMONDO_SENDER_POSTAL ?? "",
      city: process.env.SHIPMONDO_SENDER_CITY ?? "",
      country_code: "DK",
      email: process.env.SHIPMONDO_SENDER_EMAIL ?? "",
      phone: process.env.SHIPMONDO_SENDER_PHONE ?? "",
    };

    const orderRecord = order as Record<string, unknown> | undefined;
    const shippingAddress = orderRecord?.shipping_address ?? orderRecord?.delivery_address;
    const addr = shippingAddress as Record<string, unknown> | undefined;
    const receiver = {
      type: "receiver",
      name: (addr?.first_name && addr?.last_name
        ? `${addr.first_name} ${addr.last_name}`.trim()
        : (addr?.company ?? "Customer")) as string,
      address1: servicePointId
        ? ((data?.service_point_address ?? data?.service_point_name) as string) ?? "Pakkeshop"
        : (addr?.address_1 as string) ?? "",
      postal_code: servicePointId
        ? ((data?.service_point_zipcode as string) ?? (addr?.postal_code as string) ?? "")
        : ((addr?.postal_code as string) ?? ""),
      city: servicePointId
        ? ((data?.service_point_city as string) ?? (addr?.city as string) ?? "")
        : ((addr?.city as string) ?? ""),
      country_code: ((addr?.country_code as string) ?? "DK").toUpperCase(),
      email: (orderRecord?.email as string) ?? "",
      mobile: (addr?.phone as string) ?? "",
    };

    try {
      const body = {
        own_agreement: false,
        product_code: productCode,
        service_codes: serviceCodes,
        automatic_select_service_point: !servicePointId,
        ...(servicePointId && { service_point_id: servicePointId }),
        parties: [sender, receiver],
        parcels: [{ weight: totalWeight }],
        reference: String(orderId),
        print: false,
      };

      const shipment = await this.request<{
        id?: number;
        tracking_url?: string;
        label_base64?: string;
        pkg_no?: string;
      }>("POST", "/shipments", body);

      const labels: CreateFulfillmentResult["labels"] = [];
      if (shipment?.pkg_no || shipment?.tracking_url) {
        labels.push({
          tracking_number: shipment.pkg_no ?? String(shipment.id ?? ""),
          tracking_url: shipment.tracking_url ?? "",
          label_url: shipment.label_base64
            ? `data:application/pdf;base64,${shipment.label_base64}`
            : "",
        });
      }

      return {
        data: {
          shipment_id: shipment?.id,
          pkg_no: shipment?.pkg_no,
          tracking_url: shipment?.tracking_url,
        },
        labels,
      };
    } catch (err) {
      this.logger_.error(`Shipmondo createFulfillment failed: ${err instanceof Error ? err.message : String(err)}`);
      return {
        data: { error: err instanceof Error ? err.message : String(err) },
        labels: [],
      };
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<unknown> {
    const id = data?.shipment_id as number | undefined;
    if (id != null && this.options_.apiUser && this.options_.apiKey) {
      try {
        await this.request("DELETE", `/shipments/${id}`);
      } catch (e) {
        this.logger_.warn(`Shipmondo cancelFulfillment: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return {};
  }

  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    const id = data?.shipment_id as number | undefined;
    if (id == null || !this.options_.apiUser || !this.options_.apiKey) {
      return [];
    }
    try {
      const shipment = await this.request<{ label_base64?: string; pkg_no?: string; tracking_url?: string }>(
        "GET",
        `/shipments/${id}`
      );
      if (shipment?.label_base64) {
        return [
          {
            name: "label",
            url: `data:application/pdf;base64,${shipment.label_base64}`,
          },
        ] as never[];
      }
    } catch (e) {
      this.logger_.warn(`Shipmondo getFulfillmentDocuments: ${e instanceof Error ? e.message : String(e)}`);
    }
    return [];
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    this.logger_.info("Shipmondo createReturnFulfillment not implemented");
    return { data: { ...fulfillment }, labels: [] };
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return [];
  }

  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    return this.getFulfillmentDocuments(data);
  }

  async retrieveDocuments(
    fulfillmentData: Record<string, unknown>,
    _documentType: string
  ): Promise<void> {
    await this.getFulfillmentDocuments(fulfillmentData);
  }
}

export default ShipmondoFulfillmentService;
