import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils";
import type {
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
} from "@medusajs/types";
import type { Logger } from "@medusajs/framework/types";

import {
  FALLBACK_OPTION_IDS,
  extractProductCodeFromOptionLikeData,
  getFixedCheckoutCarrierOptions,
  looksLikeMedusaShippingOptionId,
  resolveProductCode,
  resolveProductCodeFromOrder,
} from "../lib/carrier-options";
import { shipmondoRequest } from "../lib/client";
import {
  getCartWeightGramsFromDb,
  getEnabledProductCodes,
  getShippingOptionRowFromDb,
  getStockLocationSenderFromDb,
} from "../lib/db";
import {
  CART_WEIGHT_CACHE_TTL_MS,
  DEFAULT_SERVICE_CODES,
  PRODUCTS_CACHE_TTL_MS,
  getBaseUrl,
  minorToMajor,
  parsePositiveIntCapped,
  shipmondoLabelFormat,
  shipmondoLabelPollDelayMs,
  sleepMs,
} from "../lib/env";
import {
  coerceLabelsEndpointResponse,
  coerceShipmondoShipmentRecord,
  debugLogShipmondoShipmentLabelShape,
  extractShipmondoGlsColliId,
  extractShipmondoLabellessCode,
  fallbackTrackingUrlForMedusaAdmin,
  parseShipmondoShipmentId,
  resolveLabelUrlForMedusaAdmin,
  resolveMedusaLabelUrlFromShipmondoShipment,
} from "../lib/labels";
import {
  getFlatAmountFromOption,
  getFlatRateMinorFromEnv,
  getPriceBandsFromOptionData,
  getPriceForWeightGrams,
  getTotalWeightGramsForFulfillmentItems,
  getWeightFromContext,
  priceFromBands,
} from "../lib/pricing";
import { normalizeProduct } from "../lib/products";
import {
  assertSenderComplete,
  buildSenderParty,
  normalizeDkPostalDigits,
  resolveOrderContactEmail,
} from "../lib/sender";
import type { ShipmondoOptions, ShipmondoProduct } from "../types";

let productsCache: { products: ShipmondoProduct[]; expiresAt: number } | null = null;

type InjectedDependencies = { logger: Logger };

class ShipmondoFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shipmondo";

  protected logger_: Logger;
  protected options_: ShipmondoOptions;
  protected baseUrl_: string;
  private cartWeightGramsCache_ = new Map<string, { grams: number; expiresAt: number }>();

  constructor({ logger }: InjectedDependencies, options: ShipmondoOptions) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.baseUrl_ = getBaseUrl(!!options.sandbox);
  }

  private req<T>(method: string, path: string, body?: object): Promise<T> {
    return shipmondoRequest<T>(this.baseUrl_, this.options_.apiUser, this.options_.apiKey, this.logger_, method, path, body);
  }

  private async fetchProducts(): Promise<ShipmondoProduct[]> {
    const now = Date.now();
    if (productsCache && productsCache.expiresAt > now) return productsCache.products;
    if (!this.options_.apiUser || !this.options_.apiKey) return [];
    try {
      const raw = await this.req<ShipmondoProduct[] | { products?: ShipmondoProduct[] }>("GET", "/products?country_code=DK");
      const list = Array.isArray(raw) ? raw : raw?.products ?? [];
      const products = list
        .filter(
          (p): p is Record<string, unknown> & { code: string; service_point_product: boolean } =>
            typeof p?.code === "string" && p.service_point_product === true
        )
        .map(normalizeProduct);
      productsCache = { products, expiresAt: now + PRODUCTS_CACHE_TTL_MS };
      return products;
    } catch (e) {
      this.logger_.warn(`Shipmondo fetchProducts failed: ${e instanceof Error ? e.message : String(e)}; using fallback options`);
      return [];
    }
  }

  private async resolveWeightGramsForPricing(context: Record<string, unknown> | undefined): Promise<number> {
    let grams = getWeightFromContext(context);
    if (grams > 0) return grams;
    const id = context?.id;
    if (typeof id !== "string" || !id.startsWith("cart_")) return 0;
    const now = Date.now();
    const hit = this.cartWeightGramsCache_.get(id);
    if (hit && hit.expiresAt > now) return hit.grams;
    grams = await getCartWeightGramsFromDb(id, this.logger_);
    this.cartWeightGramsCache_.set(id, { grams, expiresAt: now + CART_WEIGHT_CACHE_TTL_MS });
    return grams;
  }

  // -- Medusa provider interface --------------------------------------------

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    const fixed = getFixedCheckoutCarrierOptions();
    if (fixed) return fixed;
    let products = await this.fetchProducts();
    const enabledCodes = await getEnabledProductCodes(this.logger_);
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
    _context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const servicePointId = data?.service_point_id ?? optionData?.service_point_id;
    const productCode = extractProductCodeFromOptionLikeData(data) ?? extractProductCodeFromOptionLikeData(optionData);
    const out: Record<string, unknown> = { ...data };
    if (typeof servicePointId === "string" && servicePointId) out.service_point_id = servicePointId;
    if (productCode) out.product_code = productCode;
    return out;
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  async calculatePrice(
    optionData?: Record<string, unknown>,
    data?: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<CalculatedShippingOptionPrice> {
    const flatFromOptionMinor =
      getFlatAmountFromOption(optionData) ??
      (typeof data?.amount_minor === "number" && data.amount_minor >= 0 ? Math.round(data.amount_minor) : null);
    const bandsFromOption = getPriceBandsFromOptionData(optionData);
    const weightGrams = await this.resolveWeightGramsForPricing(context);

    if (bandsFromOption.length > 0 && weightGrams > 0) {
      const fromBandsMinor = priceFromBands(weightGrams, bandsFromOption);
      if (fromBandsMinor !== null) {
        return { calculated_amount: minorToMajor(fromBandsMinor), is_calculated_price_tax_inclusive: true };
      }
    }
    if (flatFromOptionMinor !== null) {
      return { calculated_amount: minorToMajor(flatFromOptionMinor), is_calculated_price_tax_inclusive: true };
    }
    const amountMinor = weightGrams > 0
      ? getPriceForWeightGrams(weightGrams, bandsFromOption.length ? bandsFromOption : undefined)
      : getFlatRateMinorFromEnv();
    return { calculated_amount: minorToMajor(amountMinor), is_calculated_price_tax_inclusive: true };
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    const servicePointId = data?.service_point_id as string | undefined;
    const optionId = (fulfillment as { shipping_option_id?: string })?.shipping_option_id;

    const dbShippingRow =
      looksLikeMedusaShippingOptionId(optionId) ? await getShippingOptionRowFromDb(optionId!, this.logger_) : null;
    const dbOptionData = dbShippingRow?.optionData ?? null;
    const profileSenderHints = dbShippingRow?.profileSenderHints ?? null;
    const fulfillmentOptionData = (fulfillment as { option?: { data?: Record<string, unknown> } })?.option?.data;

    let productCode =
      extractProductCodeFromOptionLikeData(data) ??
      extractProductCodeFromOptionLikeData(fulfillmentOptionData) ??
      resolveProductCodeFromOrder(order, optionId) ??
      extractProductCodeFromOptionLikeData(dbOptionData) ??
      (resolveProductCode(optionId) ?? undefined);

    if (!productCode || looksLikeMedusaShippingOptionId(productCode)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo: could not resolve a valid product_code for this fulfillment. " +
          "Ensure checkout persists product_code on the shipping method (validateFulfillmentData), " +
          "or configure shipping_option data (id / product_code) in Admin."
      );
    }

    const optionDataForServiceCodes =
      (fulfillmentOptionData && typeof fulfillmentOptionData === "object" ? fulfillmentOptionData : null) ?? dbOptionData;
    const serviceCodes =
      (data?.service_codes as string) ??
      (typeof optionDataForServiceCodes?.service_codes === "string" ? optionDataForServiceCodes.service_codes : undefined) ??
      process.env.SHIPMONDO_SERVICE_CODES ??
      DEFAULT_SERVICE_CODES;

    if (process.env.SHIPMONDO_DRY_RUN === "true") {
      this.logger_.info(`Shipmondo dry-run: would create shipment (product=${productCode}, service_point=${servicePointId ?? "auto"})`);
      return {
        data: { dry_run: true, service_point_id: servicePointId, product_code: productCode, order_id: order?.id },
        labels: [{ tracking_number: "DRY-RUN", tracking_url: "", label_url: "" }],
      };
    }

    if (!this.options_.apiUser || !this.options_.apiKey) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Shipmondo: label creation requires SHIPMONDO_API_USER and SHIPMONDO_API_KEY."
      );
    }

    const orderRecord = order as Record<string, unknown> | undefined;
    let receiverEmail = resolveOrderContactEmail(orderRecord);
    if (!receiverEmail && this.options_.sandbox) receiverEmail = "sandbox@localhost.invalid";
    if (!receiverEmail.includes("@")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo: receiver email is required. The order must have `email` (guest) or linked `customer.email`."
      );
    }

    const fulfillmentLocationId = (fulfillment as { location_id?: string })?.location_id;
    const stockSender = fulfillmentLocationId
      ? await getStockLocationSenderFromDb(fulfillmentLocationId, this.logger_)
      : null;
    const sender = buildSenderParty(receiverEmail, stockSender, profileSenderHints, !!this.options_.sandbox);
    assertSenderComplete(sender);

    const shippingAddress = orderRecord?.shipping_address ?? orderRecord?.delivery_address;
    const addr = shippingAddress as Record<string, unknown> | undefined;
    const receiverPostalRaw = (servicePointId
      ? ((data?.service_point_zipcode as string) ?? (addr?.postal_code as string) ?? "")
      : ((addr?.postal_code as string) ?? "")) || "";
    const receiverPostal = normalizeDkPostalDigits(receiverPostalRaw) || receiverPostalRaw.replace(/\s/g, "");

    const receiver = {
      type: "receiver" as const,
      name: (addr?.first_name && addr?.last_name ? `${addr.first_name} ${addr.last_name}`.trim() : (addr?.company ?? "Customer")) as string,
      address1: servicePointId ? ((data?.service_point_address ?? data?.service_point_name) as string) ?? "Pakkeshop" : (addr?.address_1 as string) ?? "",
      postal_code: receiverPostal,
      city: servicePointId ? ((data?.service_point_city as string) ?? (addr?.city as string) ?? "") : ((addr?.city as string) ?? ""),
      country_code: ((addr?.country_code as string) ?? "DK").toUpperCase(),
      email: receiverEmail,
      mobile: (addr?.phone as string) ?? "",
    };

    try {
      const labelFormat = shipmondoLabelFormat();
      const body = {
        own_agreement: false,
        label_format: labelFormat,
        product_code: productCode,
        service_codes: serviceCodes,
        automatic_select_service_point: !servicePointId,
        ...(servicePointId && { service_point_id: servicePointId }),
        parties: [sender, receiver],
        parcels: [{ weight: getTotalWeightGramsForFulfillmentItems(items) }],
        reference: String(order?.id ?? "unknown"),
        print: process.env.SHIPMONDO_SHIPMENT_PRINT === "true",
      };

      const postRaw = await this.req<unknown>("POST", "/shipments", body);
      const shipment = coerceShipmondoShipmentRecord(postRaw);
      debugLogShipmondoShipmentLabelShape(this.logger_, shipment, "POST /shipments (coerced)");

      const shipmentNumericId = parseShipmondoShipmentId(shipment.id);
      const pkgNo = typeof shipment.pkg_no === "string" ? shipment.pkg_no : undefined;
      const trackingUrl = typeof shipment.tracking_url === "string" ? shipment.tracking_url : "";

      let labelPayload: Record<string, unknown> = shipment;
      if (!resolveMedusaLabelUrlFromShipmondoShipment(shipment) && shipmentNumericId != null) {
        labelPayload = await this.pollForLabel(shipment, shipmentNumericId, labelFormat, pkgNo, trackingUrl);
      }

      const labels: CreateFulfillmentResult["labels"] = [];
      if (shipmentNumericId != null || !!pkgNo || !!trackingUrl) {
        const carrierCode = typeof labelPayload.carrier_code === "string" ? labelPayload.carrier_code : undefined;
        labels.push({
          tracking_number: pkgNo ?? String(shipmentNumericId ?? ""),
          tracking_url: fallbackTrackingUrlForMedusaAdmin(trackingUrl, pkgNo, carrierCode),
          label_url: resolveLabelUrlForMedusaAdmin(labelPayload, shipmentNumericId),
        });
      }

      return {
        data: {
          shipment_id: shipmentNumericId,
          pkg_no: pkgNo,
          tracking_url: trackingUrl || undefined,
          ...(extractShipmondoLabellessCode(labelPayload) ? { labelless_code: extractShipmondoLabellessCode(labelPayload) } : {}),
          ...(extractShipmondoGlsColliId(labelPayload) ? { gls_colli_id: extractShipmondoGlsColliId(labelPayload) } : {}),
        },
        labels,
      };
    } catch (err) {
      if (err instanceof MedusaError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger_.error(`Shipmondo createFulfillment failed: ${msg}`);
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Shipmondo shipment failed: ${msg}`);
    }
  }

  private async pollForLabel(
    shipment: Record<string, unknown>,
    shipmentNumericId: number,
    labelFormat: string,
    pkgNo: string | undefined,
    trackingUrl: string
  ): Promise<Record<string, unknown>> {
    const maxAttempts = parsePositiveIntCapped("SHIPMONDO_LABEL_GET_MAX_ATTEMPTS", 5, 15);
    const delayMs = shipmondoLabelPollDelayMs();
    const labelsPath = `/shipments/${shipmentNumericId}/labels?label_format=${encodeURIComponent(labelFormat)}`;
    let labelPayload: Record<string, unknown> = shipment;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await sleepMs(delayMs);
      try {
        const labelsRaw = await this.req<unknown>("GET", labelsPath);
        const labelsPayload = coerceLabelsEndpointResponse(labelsRaw);
        if (labelsPayload) {
          labelPayload = { ...shipment, ...labelsPayload };
          debugLogShipmondoShipmentLabelShape(this.logger_, labelPayload, `GET ${labelsPath} (label poll ${attempt + 1}/${maxAttempts})`);
          if (resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) break;
        }
      } catch {
        try {
          const gotRaw = await this.req<unknown>("GET", `/shipments/${shipmentNumericId}`);
          const got = coerceShipmondoShipmentRecord(gotRaw);
          debugLogShipmondoShipmentLabelShape(this.logger_, got, `GET /shipments/${shipmentNumericId} (label poll fallback ${attempt + 1}/${maxAttempts})`);
          if (Object.keys(got).length > 0) labelPayload = got;
          if (resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) break;
        } catch (e2) {
          this.logger_.warn(`Shipmondo: label poll ${attempt + 1}/${maxAttempts} failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
        }
      }
    }

    if (!resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) {
      const labelless = extractShipmondoLabellessCode(labelPayload);
      if (labelless) {
        this.logger_.info(
          `Shipmondo: shipment ${shipmentNumericId} has no label PDF in JSON (labelless / E-label flow). ` +
            `labelless_code is stored on fulfillment data. pkg/tracking: ${pkgNo ?? "—"} / ${trackingUrl || "—"}. ` +
            "For a downloadable PDF in some setups, try SHIPMONDO_SHIPMENT_PRINT=true or use Shipmondo UI."
        );
      } else {
        this.logger_.warn(
          `Shipmondo: no label PDF/URL in POST/GET after ${maxAttempts} attempt(s) for shipment ${shipmentNumericId}. ` +
            "Carrier may expose the label only in the Shipmondo UI for a short delay; try getFulfillmentDocuments later or increase SHIPMONDO_LABEL_GET_MAX_ATTEMPTS / SHIPMONDO_LABEL_GET_RETRY_MS."
        );
      }
    }
    return labelPayload;
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<unknown> {
    const id = data?.shipment_id as number | undefined;
    if (id != null && this.options_.apiUser && this.options_.apiKey) {
      try { await this.req("DELETE", `/shipments/${id}`); } catch (e) {
        this.logger_.warn(`Shipmondo cancelFulfillment: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return {};
  }

  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    const id = data?.shipment_id as number | undefined;
    if (id == null || !this.options_.apiUser || !this.options_.apiKey) return [];
    const labelFormat = shipmondoLabelFormat();
    try {
      const labelsRaw = await this.req<unknown>("GET", `/shipments/${id}/labels?label_format=${encodeURIComponent(labelFormat)}`);
      const labelsPayload = coerceLabelsEndpointResponse(labelsRaw);
      if (labelsPayload) {
        const url = resolveLabelUrlForMedusaAdmin(labelsPayload, id);
        if (url) return [{ name: "label", url }] as never[];
      }
    } catch { /* fall through */ }
    try {
      const raw = await this.req<unknown>("GET", `/shipments/${id}`);
      const shipment = coerceShipmondoShipmentRecord(raw);
      const url = resolveLabelUrlForMedusaAdmin(shipment, id);
      if (url) return [{ name: "label", url }] as never[];
    } catch (e) {
      this.logger_.warn(`Shipmondo getFulfillmentDocuments: ${e instanceof Error ? e.message : String(e)}`);
    }
    return [];
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    this.logger_.info("Shipmondo createReturnFulfillment not implemented");
    return { data: { ...fulfillment }, labels: [] };
  }

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> { return []; }
  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> { return this.getFulfillmentDocuments(data); }
  async retrieveDocuments(fulfillmentData: Record<string, unknown>, _documentType: string): Promise<void> {
    await this.getFulfillmentDocuments(fulfillmentData);
  }
}

export default ShipmondoFulfillmentService;
