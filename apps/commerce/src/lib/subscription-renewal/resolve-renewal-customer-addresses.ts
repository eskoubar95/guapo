import { Modules } from "@medusajs/framework/utils";
import type { CustomerAddressDTO, ICustomerModuleService } from "@medusajs/types";

import { hasParcelShopDeliveryData } from "../subscription-delivery-data";

function customerAddressToOrderShape(
  a: CustomerAddressDTO,
  email: string
): Record<string, unknown> {
  return {
    first_name: a.first_name ?? "",
    last_name: a.last_name ?? "",
    address_1: a.address_1 ?? "",
    address_2: a.address_2 ?? "",
    city: a.city ?? "",
    postal_code: a.postal_code ?? "",
    country_code: typeof a.country_code === "string" ? a.country_code.toLowerCase() : "dk",
    phone: a.phone ?? undefined,
    ...(email ? { email } : {}),
  };
}

function pickPreferredCustomerAddress(addresses: CustomerAddressDTO[]): CustomerAddressDTO | null {
  if (!addresses?.length) return null;
  const hasLine = (x: CustomerAddressDTO) => Boolean(x.address_1?.trim());
  const byShipping = addresses.find((x) => x.is_default_shipping && hasLine(x));
  if (byShipping) return byShipping;
  const byBilling = addresses.find((x) => x.is_default_billing && hasLine(x));
  if (byBilling) return byBilling;
  return addresses.find(hasLine) ?? null;
}

/**
 * When shipping is Shipmondo pakkeshop (or legacy: ship line ≠ bill line), the **destination**
 * is defined by the subscription’s shipping snapshot + `delivery_data` on the method — not by
 * replacing street/city with the customer’s saved “default shipping” address.
 * We only sync **contact** fields (name, phone, email) from the customer profile.
 *
 * For pure home delivery (same ship/bill lines, no parcel payload), we still replace both
 * addresses from the customer’s saved address when present.
 */
export async function resolveRenewalAddressesFromCustomer(
  container: { resolve: (key: string) => unknown },
  customerId: string,
  fallbackShipping: Record<string, unknown>,
  fallbackBilling: Record<string, unknown>,
  deliveryData?: Record<string, unknown> | null
): Promise<{ shipping: Record<string, unknown>; billing: Record<string, unknown>; email: string }> {
  const customerModule = container.resolve(Modules.CUSTOMER) as ICustomerModuleService;

  let email = "";
  let customerFirst: string | undefined;
  let customerLast: string | undefined;
  try {
    const c = await customerModule.retrieveCustomer(customerId);
    email = c.email ?? "";
    customerFirst = c.first_name ?? undefined;
    customerLast = c.last_name ?? undefined;
  } catch {
    /* use fallback */
  }

  let addresses: CustomerAddressDTO[] = [];
  try {
    addresses = await customerModule.listCustomerAddresses(
      { customer_id: customerId },
      { take: 50 }
    );
  } catch {
    addresses = [];
  }

  const picked = pickPreferredCustomerAddress(addresses);

  const shipLine = String(fallbackShipping.address_1 ?? "").trim();
  const billLine = String(fallbackBilling.address_1 ?? "").trim();
  const lockShippingAddressLines =
    hasParcelShopDeliveryData(deliveryData ?? undefined) ||
    (shipLine.length > 0 && billLine.length > 0 && shipLine !== billLine);

  if (lockShippingAddressLines) {
    const shipping: Record<string, unknown> = { ...fallbackShipping };
    if (picked) {
      if (picked.first_name) shipping.first_name = picked.first_name;
      if (picked.last_name) shipping.last_name = picked.last_name;
      if (picked.phone) shipping.phone = picked.phone;
    } else {
      if (customerFirst) shipping.first_name = customerFirst;
      if (customerLast) shipping.last_name = customerLast;
    }
    if (email) shipping.email = email;

    if (picked) {
      return {
        shipping,
        billing: customerAddressToOrderShape(picked, email),
        email,
      };
    }

    const billing: Record<string, unknown> = { ...fallbackBilling };
    if (email) billing.email = email;
    if (customerFirst) billing.first_name = customerFirst;
    if (customerLast) billing.last_name = customerLast;
    return { shipping, billing, email };
  }

  if (picked) {
    const shaped = customerAddressToOrderShape(picked, email);
    return { shipping: shaped, billing: shaped, email };
  }

  const ship = { ...fallbackShipping };
  const bill = { ...fallbackBilling };
  if (email && typeof ship.email !== "string") {
    ship.email = email;
  }
  if (email && typeof bill.email !== "string") {
    bill.email = email;
  }
  return { shipping: ship, billing: bill, email };
}
