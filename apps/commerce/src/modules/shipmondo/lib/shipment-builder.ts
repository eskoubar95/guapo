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
  mobile: string;
};

export type SenderPartyLike = Record<string, unknown>;

/**
 * Builds Shipmondo receiver party from order address and optional service point data.
 */
export function buildShipmondoReceiverParty(
  data: Record<string, unknown>,
  servicePointId: string | undefined,
  orderRecord: Record<string, unknown> | undefined,
  receiverEmail: string
): ReceiverParty {
  const shippingAddress = orderRecord?.shipping_address ?? orderRecord?.delivery_address;
  const addr = shippingAddress as Record<string, unknown> | undefined;
  const receiverPostalRaw = (
    servicePointId
      ? ((data?.service_point_zipcode as string) ?? (addr?.postal_code as string) ?? "")
      : ((addr?.postal_code as string) ?? "")
  ) || "";
  const receiverPostal =
    normalizeDkPostalDigits(receiverPostalRaw) || receiverPostalRaw.replace(/\s/g, "");

  return {
    type: "receiver",
    name: (addr?.first_name && addr?.last_name
      ? `${addr.first_name} ${addr.last_name}`.trim()
      : (addr?.company ?? "Customer")) as string,
    address1: servicePointId
      ? ((data?.service_point_address ?? data?.service_point_name) as string) ?? "Pakkeshop"
      : (addr?.address_1 as string) ?? "",
    postal_code: receiverPostal,
    city: servicePointId
      ? ((data?.service_point_city as string) ?? (addr?.city as string) ?? "")
      : ((addr?.city as string) ?? ""),
    country_code: ((addr?.country_code as string) ?? "DK").toUpperCase(),
    email: receiverEmail,
    mobile: (addr?.phone as string) ?? "",
  };
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
  orderId: string | undefined;
  printShipment: boolean;
}): Record<string, unknown> {
  const {
    labelFormat,
    productCode,
    serviceCodes,
    servicePointId,
    sender,
    receiver,
    items,
    orderId,
    printShipment,
  } = input;

  return {
    own_agreement: false,
    label_format: labelFormat,
    product_code: productCode,
    service_codes: serviceCodes,
    automatic_select_service_point: !servicePointId,
    ...(servicePointId && { service_point_id: servicePointId }),
    parties: [sender, receiver],
    parcels: [{ weight: getTotalWeightGramsForFulfillmentItems(items) }],
    reference: String(orderId ?? "unknown"),
    print: printShipment,
  };
}
