import { MedusaError } from "@medusajs/framework/utils";

import type { StockLocationSender } from "./db";

export type SenderParty = {
  type: "sender";
  name: string;
  address1: string;
  postal_code: string;
  city: string;
  country_code: string;
  email: string;
  phone: string;
};

export type ProfileSenderHints = {
  sender_email?: string;
  sender_phone?: string;
  sender_name?: string;
};

/** DK postcodes: Shipmondo expects exactly 4 digits. */
export function normalizeDkPostalDigits(raw: string | undefined): string {
  if (raw == null || typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(0, 4) : digits;
}

/** Guest orders use `email`; registered customers often only have `customer.email` on the loaded order. */
export function resolveOrderContactEmail(orderRecord: Record<string, unknown> | undefined): string {
  if (!orderRecord) return "";
  const pick = (v: unknown): string => (typeof v === "string" && v.includes("@") ? v.trim() : "");
  let e = pick(orderRecord.email);
  if (e) return e;
  const cust = orderRecord.customer;
  if (cust && typeof cust === "object") {
    e = pick((cust as Record<string, unknown>).email);
    if (e) return e;
  }
  return "";
}

export function buildSenderParty(
  receiverEmailFallback: string,
  stock: StockLocationSender | null,
  profileHints: ProfileSenderHints | null,
  sandbox: boolean
): SenderParty {
  const envCountry = (process.env.SHIPMONDO_SENDER_COUNTRY ?? "").trim().toUpperCase().slice(0, 2);
  const stockCountry = (stock?.country_code ?? "DK").trim().toUpperCase().slice(0, 2) || "DK";
  const country_code = envCountry || stockCountry;

  const name =
    (process.env.SHIPMONDO_SENDER_NAME ?? "").trim() ||
    (profileHints?.sender_name ?? "").trim() ||
    (stock?.locationName ?? "").trim() ||
    "Guapo";

  let address1 = (process.env.SHIPMONDO_SENDER_ADDRESS ?? "").trim() || (stock?.address_1 ?? "").trim();
  let city = (process.env.SHIPMONDO_SENDER_CITY ?? "").trim() || (stock?.city ?? "").trim();
  const postalRaw = (process.env.SHIPMONDO_SENDER_POSTAL ?? "").trim() || (stock?.postal_code ?? "").trim();
  let postal = country_code === "DK" ? normalizeDkPostalDigits(postalRaw) : postalRaw.replace(/\s/g, "");

  let email =
    (process.env.SHIPMONDO_SENDER_EMAIL ?? "").trim() ||
    (profileHints?.sender_email && profileHints.sender_email.includes("@") ? profileHints.sender_email.trim() : "") ||
    (stock?.sender_email && stock.sender_email.includes("@") ? stock.sender_email.trim() : "");
  const phone =
    (process.env.SHIPMONDO_SENDER_PHONE ?? "").trim() ||
    (stock?.phone ?? "").trim() ||
    (profileHints?.sender_phone ?? "").trim();

  const incomplete =
    !address1 || !city || (country_code === "DK" ? postal.length !== 4 : postal.trim().length < 2) || !email;

  if (incomplete && sandbox) {
    if (!address1) address1 = "Sandboxgade 1";
    if (!city) city = "København";
    if (country_code === "DK" && postal.length !== 4) postal = "2100";
    if (country_code !== "DK" && postal.trim().length < 2) postal = "1000";
    if (!email) email = receiverEmailFallback.includes("@") ? receiverEmailFallback : "noreply@localhost.invalid";
  }

  if (!email && receiverEmailFallback.includes("@")) {
    email = receiverEmailFallback;
  }

  return { type: "sender", name: name || "Guapo", address1, postal_code: postal, city, country_code, email, phone };
}

export function assertSenderComplete(sender: SenderParty): void {
  const cc = (sender.country_code || "DK").toUpperCase();
  const postalOk = cc === "DK" ? sender.postal_code.length === 4 : sender.postal_code.trim().length >= 2;
  if (!sender.address1.trim() || !sender.city.trim() || !postalOk || !sender.email.includes("@")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Shipmondo: sender address is incomplete for POST /shipments. Configure the **stock location address** " +
        "(Settings → Locations) for the fulfillment location. Carrier contact email: **Shipping profile → Metadata** " +
        "(`sender_email`, optional `sender_name` / `sender_phone`) or env `SHIPMONDO_SENDER_*`. " +
        "For DK, postal code must be 4 digits. With `SHIPMONDO_SANDBOX=true`, placeholders apply when data is still missing."
    );
  }
}
