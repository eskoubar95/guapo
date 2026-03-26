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
  resolveCarrierCodeFromOrderShippingMethod,
  resolveProductCode,
  resolveProductCodeFromCarrierCode,
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
  shipmondoLabelFormat,
  shipmondoOwnAgreementFromEnv,
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
import { pollShipmondoForLabel } from "../lib/label-polling";
import {
  getFlatAmountFromOption,
  getFlatRateMinorFromEnv,
  getPriceBandsFromOptionData,
  getPriceForWeightGrams,
  getWeightFromContext,
  priceFromBands,
} from "../lib/pricing";
import { buildShipmondoProductsQueryString } from "../fetch-products";
import { normalizeProduct, rawShipmondoProductIsServicePoint } from "../lib/products";
import {
  buildShipmondoReceiverParty,
  buildShipmondoShipmentPostBody,
  normalizePhoneForShipmondoParty,
  resolveShipmondoOrderReference,
} from "../lib/shipment-builder";
import {
  assertSenderComplete,
  buildSenderParty,
  resolveOrderContactEmail,
} from "../lib/sender";
import type { ShipmondoOptions, ShipmondoProduct } from "../types";

type InjectedDependencies = { logger: Logger };

class ShipmondoFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shipmondo";

  protected logger_: Logger;
  protected options_: ShipmondoOptions;
  protected baseUrl_: string;
  private cartWeightGramsCache_ = new Map<string, { grams: number; expiresAt: number }>();
  private productsCache_: { products: ShipmondoProduct[]; expiresAt: number } | null = null;

  constructor({ logger }: InjectedDependencies, options: ShipmondoOptions) {
    super();
    this.logger_ = logger;
    this.options_ = options;
    this.baseUrl_ = getBaseUrl(!!options.sandbox);
  }

  private req<T>(method: string, path: string, body?: object): Promise<T> {
    return shipmondoRequest<T>(
      this.baseUrl_,
      this.options_.apiUser,
      this.options_.apiKey,
      this.logger_,
      method,
      path,
      body
    );
  }

  private async fetchProducts(): Promise<ShipmondoProduct[]> {
    const now = Date.now();
    if (this.productsCache_ && this.productsCache_.expiresAt > now) {
      return this.productsCache_.products;
    }
    if (!this.options_.apiUser || !this.options_.apiKey) return [];
    try {
      const qs = buildShipmondoProductsQueryString({ countryCode: "DK", senderCountryCode: "DK" });
      const raw = await this.req<ShipmondoProduct[] | { products?: ShipmondoProduct[] }>(
        "GET",
        `/products?${qs}`
      );
      const list = Array.isArray(raw) ? raw : raw?.products ?? [];
      const products = list
        .filter((p): p is Record<string, unknown> & { code: string } => {
          if (typeof (p as { code?: string })?.code !== "string") return false;
          return rawShipmondoProductIsServicePoint(p as Record<string, unknown>);
        })
        .map((p) => normalizeProduct({ ...(p as Record<string, unknown>), code: (p as { code: string }).code }));
      this.productsCache_ = { products, expiresAt: now + PRODUCTS_CACHE_TTL_MS };
      return products;
    } catch (e) {
      this.logger_.warn(
        `Shipmondo fetchProducts failed: ${e instanceof Error ? e.message : String(e)}; using fallback options`
      );
      return [];
    }
  }

  /**
   * Validate a candidate product code against the API products list (service-point subset).
   * When the code matches, use API `required_services` for default service_codes.
   * When it does not match (e.g. filtered list omits the code), send the candidate as-is —
   * do **not** substitute another product with the same carrier (that picked wrong DAO_* codes).
   */
  private async resolveValidatedProductCode(
    candidateCode: string,
    _carrierCode: string | undefined
  ): Promise<{ code: string; requiredServiceCodes: string | undefined }> {
    const products = await this.fetchProducts();
    if (products.length === 0) {
      return { code: candidateCode, requiredServiceCodes: undefined };
    }

    const exact = products.find((p) => p.code === candidateCode);
    if (exact) {
      return {
        code: exact.code,
        requiredServiceCodes: this.extractRequiredServiceCodes(exact),
      };
    }

    this.logger_.warn(
      `Shipmondo: product_code "${candidateCode}" not found in GET /products ` +
        `(available: ${products.map((p) => p.code).join(", ")}). ` +
        `Sending as-is — if Shipmondo rejects it, check product activation in your Shipmondo account.`
    );
    return { code: candidateCode, requiredServiceCodes: undefined };
  }

  private extractRequiredServiceCodes(product: ShipmondoProduct): string | undefined {
    const raw = product as Record<string, unknown>;
    const required = raw.required_services;
    if (!Array.isArray(required) || required.length === 0) return undefined;
    const codes = required
      .map((s: unknown) => (s as Record<string, unknown>)?.code)
      .filter((c): c is string => typeof c === "string" && c.length > 0);
    return codes.length > 0 ? codes.join(",") : undefined;
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
    let productCode =
      extractProductCodeFromOptionLikeData(data) ?? extractProductCodeFromOptionLikeData(optionData);
    if (!productCode) {
      const carrier = typeof data?.carrier_code === "string" ? data.carrier_code : undefined;
      productCode = resolveProductCodeFromCarrierCode(carrier) ?? productCode;
    }
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
      (typeof data?.amount_minor === "number" && data.amount_minor >= 0
        ? Math.round(data.amount_minor)
        : null);
    const bandsFromOption = getPriceBandsFromOptionData(optionData);
    const weightGrams = await this.resolveWeightGramsForPricing(context);

    /** Bands / flat amounts in Admin are ex. moms (DK); Medusa adds VAT on top. */
    if (bandsFromOption.length > 0 && weightGrams > 0) {
      const fromBandsMinor = priceFromBands(weightGrams, bandsFromOption);
      if (fromBandsMinor !== null) {
        return {
          calculated_amount: minorToMajor(fromBandsMinor),
          is_calculated_price_tax_inclusive: false,
        };
      }
    }
    if (flatFromOptionMinor !== null) {
      return {
        calculated_amount: minorToMajor(flatFromOptionMinor),
        is_calculated_price_tax_inclusive: false,
      };
    }
    const amountMinor =
      weightGrams > 0
        ? getPriceForWeightGrams(weightGrams, bandsFromOption.length ? bandsFromOption : undefined)
        : getFlatRateMinorFromEnv();
    return {
      calculated_amount: minorToMajor(amountMinor),
      is_calculated_price_tax_inclusive: false,
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

    const dbShippingRow =
      looksLikeMedusaShippingOptionId(optionId)
        ? await getShippingOptionRowFromDb(optionId!, this.logger_)
        : null;
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
      const carrierFromData = typeof data?.carrier_code === "string" ? data.carrier_code : undefined;
      const carrierFromOrder = resolveCarrierCodeFromOrderShippingMethod(order, optionId);
      const fromCarrier = resolveProductCodeFromCarrierCode(carrierFromData ?? carrierFromOrder);
      if (fromCarrier) productCode = fromCarrier;
    }

    if (!productCode || looksLikeMedusaShippingOptionId(productCode)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo: could not resolve a valid product_code for this fulfillment. " +
          "Ensure checkout persists product_code on the shipping method (validateFulfillmentData), " +
          "or configure shipping_option data (id / product_code) in Admin."
      );
    }

    if (process.env.SHIPMONDO_DRY_RUN === "true") {
      this.logger_.info(
        `Shipmondo dry-run: would create shipment (product=${productCode}, service_point=${servicePointId ?? "auto"})`
      );
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

    const carrierCode =
      (typeof data?.carrier_code === "string" ? data.carrier_code : undefined) ??
      resolveCarrierCodeFromOrderShippingMethod(order, optionId);

    const validated = await this.resolveValidatedProductCode(productCode, carrierCode);
    productCode = validated.code;

    const optionDataForServiceCodes =
      (fulfillmentOptionData && typeof fulfillmentOptionData === "object" ? fulfillmentOptionData : null) ??
      dbOptionData;
    const ownAgreement =
      typeof data?.own_agreement === "boolean"
        ? data.own_agreement
        : typeof optionDataForServiceCodes?.own_agreement === "boolean"
          ? optionDataForServiceCodes.own_agreement
          : shipmondoOwnAgreementFromEnv();
    const serviceCodes =
      (data?.service_codes as string) ??
      (typeof optionDataForServiceCodes?.service_codes === "string"
        ? optionDataForServiceCodes.service_codes
        : undefined) ??
      validated.requiredServiceCodes ??
      process.env.SHIPMONDO_SERVICE_CODES ??
      DEFAULT_SERVICE_CODES;

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

    const receiver = buildShipmondoReceiverParty(data, orderRecord, receiverEmail);
    if (!receiver.phone || receiver.phone.trim() === "") {
      const fallbackMobile = process.env.SHIPMONDO_RECEIVER_MOBILE_FALLBACK?.trim();
      if (fallbackMobile) {
        receiver.phone = normalizePhoneForShipmondoParty(fallbackMobile, receiver.country_code);
      } else if (this.options_.sandbox || process.env.NODE_ENV !== "production") {
        // Dev/sandbox: DK 8-digit national format (Shipmondo parties use `phone`, not `mobile`).
        receiver.phone = normalizePhoneForShipmondoParty("11111111", receiver.country_code);
      } else {
        this.logger_?.warn?.(
          "Shipmondo: receiver phone missing and no SHIPMONDO_RECEIVER_MOBILE_FALLBACK set; shipment may be rejected by carrier."
        );
      }
    }

    try {
      const labelFormat = shipmondoLabelFormat();
      const shipmentReference = resolveShipmondoOrderReference(orderRecord, order?.id);
      const body = buildShipmondoShipmentPostBody({
        labelFormat,
        productCode,
        serviceCodes,
        servicePointId,
        sender: sender as Record<string, unknown>,
        receiver,
        items,
        reference: shipmentReference,
        printShipment: process.env.SHIPMONDO_SHIPMENT_PRINT === "true",
        ownAgreement,
      });

      const postRaw = await this.req<unknown>("POST", "/shipments", body);
      const shipment = coerceShipmondoShipmentRecord(postRaw);
      debugLogShipmondoShipmentLabelShape(this.logger_, shipment, "POST /shipments (coerced)");

      const shipmentNumericId = parseShipmondoShipmentId(shipment.id);
      const pkgNo = typeof shipment.pkg_no === "string" ? shipment.pkg_no : undefined;
      const trackingUrl = typeof shipment.tracking_url === "string" ? shipment.tracking_url : "";

      let labelPayload: Record<string, unknown> = shipment;
      if (!resolveMedusaLabelUrlFromShipmondoShipment(shipment) && shipmentNumericId != null) {
        labelPayload = await pollShipmondoForLabel(
          this.logger_,
          (method, path, reqBody) => this.req(method, path, reqBody),
          shipment,
          shipmentNumericId,
          labelFormat,
          pkgNo,
          trackingUrl
        );
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
          ...(extractShipmondoLabellessCode(labelPayload)
            ? { labelless_code: extractShipmondoLabellessCode(labelPayload) }
            : {}),
          ...(extractShipmondoGlsColliId(labelPayload)
            ? { gls_colli_id: extractShipmondoGlsColliId(labelPayload) }
            : {}),
        },
        labels,
      };
    } catch (err) {
      if (err instanceof MedusaError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger_.error(`Shipmondo createFulfillment failed: ${msg}`);
      const hint =
        /product_code invalid or missing/i.test(msg) && productCode
          ? ` (resolved product_code=${JSON.stringify(productCode)} — confirm code in Shipmondo GET /products?country_code=DK or portal; override with SHIPMONDO_DAO_PRODUCT_CODE / SHIPMONDO_GLS_PRODUCT_CODE if needed)`
          : "";
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Shipmondo shipment failed: ${msg}${hint}`);
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<unknown> {
    const id = data?.shipment_id as number | undefined;
    if (id != null && this.options_.apiUser && this.options_.apiKey) {
      try {
        await this.req("DELETE", `/shipments/${id}`);
      } catch (e) {
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
      const labelsRaw = await this.req<unknown>(
        "GET",
        `/shipments/${id}/labels?label_format=${encodeURIComponent(labelFormat)}`
      );
      const labelsPayload = coerceLabelsEndpointResponse(labelsRaw);
      if (labelsPayload) {
        const url = resolveLabelUrlForMedusaAdmin(labelsPayload, id);
        if (url) return [{ name: "label", url }] as never[];
      }
    } catch {
      /* fall through */
    }
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

  async getReturnDocuments(_data: Record<string, unknown>): Promise<never[]> {
    return [];
  }
  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    return this.getFulfillmentDocuments(data);
  }
  async retrieveDocuments(fulfillmentData: Record<string, unknown>, _documentType: string): Promise<void> {
    await this.getFulfillmentDocuments(fulfillmentData);
  }
}

export default ShipmondoFulfillmentService;
