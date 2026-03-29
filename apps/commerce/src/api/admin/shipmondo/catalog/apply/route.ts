import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { applyShipmondoCatalogSelection } from "../../../../../modules/shipmondo/apply-catalog-selection";

type Body = {
  receiver_country?: string;
  sender_country?: string;
  product_codes?: string[];
  /** Per-product toggles (preferred for catalog wizard). */
  product_selections?: {
    product_code: string;
    carrier_code?: string;
    email_notification?: boolean;
    sms_notification?: boolean;
  }[];
  email_notification?: boolean;
  sms_notification?: boolean;
  service_point_only?: boolean;
};

/**
 * POST /admin/shipmondo/catalog/apply
 * Apply wizard selection: upsert enabled products + shipping options with API-derived service_codes + toggles.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as Body;
  const selections = Array.isArray(body.product_selections) ? body.product_selections : [];
  const codes = Array.isArray(body.product_codes) ? body.product_codes : [];
  const hasSelections = selections.some((s) => typeof s?.product_code === "string" && s.product_code.trim().length > 0);
  const hasCodes = codes.some((c) => typeof c === "string" && c.length > 0);
  if (!hasSelections && !hasCodes) {
    return res.status(400).json({ message: "product_codes or product_selections (non-empty) required" });
  }

  try {
    const result = await applyShipmondoCatalogSelection(req.scope, {
      receiverCountryCode: body.receiver_country ?? "DK",
      senderCountryCode: body.sender_country,
      productCodes: codes.filter((c): c is string => typeof c === "string" && c.length > 0),
      productSelections: hasSelections
        ? selections
            .filter(
              (s): s is {
                product_code: string;
                carrier_code?: string;
                email_notification?: boolean;
                sms_notification?: boolean;
              } => s != null && typeof s.product_code === "string" && s.product_code.trim().length > 0
            )
            .map((s) => ({
              product_code: s.product_code.trim(),
              carrier_code: typeof s.carrier_code === "string" ? s.carrier_code.trim() : undefined,
              email_notification: s.email_notification,
              sms_notification: s.sms_notification,
            }))
        : undefined,
      emailNotification: body.email_notification !== false,
      smsNotification: body.sms_notification !== false,
      servicePointOnly: body.service_point_only !== false,
    });
    return res.json(result);
  } catch (e) {
    return res.status(400).json({
      message: e instanceof Error ? e.message : "Apply failed",
    });
  }
};
