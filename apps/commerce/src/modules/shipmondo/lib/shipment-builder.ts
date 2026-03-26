import type { FulfillmentItemDTO } from "@medusajs/types";

import { normalizeDkPostalDigits } from "./sender";
import { getTotalWeightGramsForFulfillmentItems } from "./pricing";

export type ReceiverParty = {
  type: "receiver";
  name: string;
  address1: string;
  postal_code: string;
  city: string;
  country_code: string;
  email: string;
  /** Shipmondo API v3 parties use `phone` (not `mobile`). DK mobiles are typically 8 digits (national). */
  phone: string;
};

export type SenderPartyLike = Record<string, unknown>;

/**
 * Human-visible order reference for Shipmondo (not internal `order_01…` id).
 */
export function resolveShipmondoOrderReference(
  order: Record<string, unknown> | undefined,
  fallbackOrderId: string | undefined
): string {
  const custom = order?.custom_display_id;
  if (typeof custom === "string" && custom.trim().length > 0) return custom.trim();
  const display = order?.display_id;
  if (display != null && display !== "") {
    const s = String(display).trim();
    if (s.length > 0) return s;
  }
  return String(fallbackOrderId ?? "unknown");
}

/**
 * Builds Shipmondo receiver party from the order shipping address (the customer).
 * Pakkeshop location is sent only via `service_point_id` on POST /shipments — not as receiver address.
 */
export function buildShipmondoReceiverParty(
  data: Record<string, unknown>,
  orderRecord: Record<string, unknown> | undefined,
  receiverEmail: string
): ReceiverParty {
  const shippingAddress = orderRecord?.shipping_address ?? orderRecord?.delivery_address;
  const addr = shippingAddress as Record<string, unknown> | undefined;
  const receiverPostalRaw = String((addr?.postal_code as string) ?? "").trim();
  const receiverPostal =
    normalizeDkPostalDigits(receiverPostalRaw) || receiverPostalRaw.replace(/\s/g, "");

  const countryCode = ((addr?.country_code as string) ?? "DK").toUpperCase();
  const rawPhone = resolveReceiverMobile(addr, orderRecord, data);
  const phone = normalizePhoneForShipmondoParty(rawPhone, countryCode);

  return {
    type: "receiver",
    name: (addr?.first_name && addr?.last_name
      ? `${addr.first_name} ${addr.last_name}`.trim()
      : (addr?.company ?? "Customer")) as string,
    address1: (addr?.address_1 as string) ?? "",
    postal_code: receiverPostal,
    city: ((addr?.city as string) ?? ""),
    country_code: countryCode,
    email: receiverEmail,
    phone,
  };
}

function nonEmptyString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * Shipmondo party `phone` for DK: 8 digits national (see https://shipmondo.dev/docs/api/parties).
 * Strips +45 / 0045 / spaces; keeps last 8 digits when input is 45 + 8 digits.
 */
export function normalizePhoneForShipmondoParty(raw: string, countryCode: string): string {
  const cc = (countryCode || "DK").toUpperCase().slice(0, 2);
  if (!raw || typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (cc === "DK") {
    if (digits.length === 8) return digits;
    if (digits.length === 10 && digits.startsWith("45")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0045")) return digits.slice(4);
    if (digits.length > 8 && digits.startsWith("45")) return digits.slice(-8);
    if (digits.length >= 8) return digits.slice(-8);
    return digits;
  }
  return raw.trim();
}

/**
 * Resolve receiver mobile from multiple sources:
 * 1. shipping_address.phone
 * 2. billing_address.phone
 * 3. customer.phone
 * 4. order-level phone
 * 5. fulfillment data phone
 */
function resolveReceiverMobile(
  addr: Record<string, unknown> | undefined,
  orderRecord: Record<string, unknown> | undefined,
  data: Record<string, unknown>
): string {
  const billing = orderRecord?.billing_address as Record<string, unknown> | undefined;
  const customer = orderRecord?.customer as Record<string, unknown> | undefined;
  return (
    nonEmptyString(addr?.phone) ??
    nonEmptyString(billing?.phone) ??
    nonEmptyString(customer?.phone) ??
    nonEmptyString(orderRecord?.phone) ??
    nonEmptyString(data?.phone) ??
    ""
  );
}

/**
 * POST /shipments body for Shipmondo.
 */
export function buildShipmondoShipmentPostBody(input: {
  labelFormat: string;
  productCode: string;
  serviceCodes: string;
  servicePointId: string | undefined;
  sender: SenderPartyLike;
  receiver: ReceiverParty;
  items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[];
  /** Shown in Shipmondo UI; prefer display_id / custom_display_id, not internal Medusa id. */
  reference: string;
  printShipment: boolean;
  /** Default false; set true when the product requires your own carrier agreement in Shipmondo. */
  ownAgreement?: boolean;
}): Record<string, unknown> {
  const {
    labelFormat,
    productCode,
    serviceCodes,
    servicePointId,
    sender,
    receiver,
    items,
    reference,
    printShipment,
    ownAgreement = false,
  } = input;

  return {
    own_agreement: ownAgreement,
    label_format: labelFormat,
    product_code: productCode,
    service_codes: serviceCodes,
    automatic_select_service_point: !servicePointId,
    ...(servicePointId && { service_point_id: servicePointId }),
    parties: [sender, receiver],
    parcels: [{ weight: getTotalWeightGramsForFulfillmentItems(items) }],
    reference,
    print: printShipment,
  };
}
