import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  coerceLabelsEndpointResponse,
  coerceShipmondoShipmentRecord,
  extractShipmondoLabelBase64,
  shipmondoLabelFormat,
} from "../../../../../../modules/shipmondo/service";

function shipmondoBaseUrl(): string {
  return process.env.SHIPMONDO_SANDBOX === "true"
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

async function shipmondoGetJson<T>(path: string): Promise<T> {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  if (!apiUser || !apiKey) {
    throw new Error("SHIPMONDO_API_USER and SHIPMONDO_API_KEY required");
  }
  const url = `${shipmondoBaseUrl()}${path}`;
  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shipmondo GET ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * GET /admin/shipmondo/shipments/:id/label
 * Streams PDF for a Shipmondo shipment (used by Medusa Admin instead of huge data: URLs).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const idParam = req.params?.id;
  const shipmentId = typeof idParam === "string" ? Number.parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(shipmentId)) {
    return res.status(400).json({ message: "Invalid shipment id" });
  }
  const labelFormat = shipmondoLabelFormat();
  const labelsPath = `/shipments/${shipmentId}/labels?label_format=${encodeURIComponent(labelFormat)}`;

  let raw: unknown;
  try {
    raw = await shipmondoGetJson<unknown>(labelsPath);
  } catch {
    try {
      raw = await shipmondoGetJson<unknown>(`/shipments/${shipmentId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return res.status(502).json({ message: msg });
    }
  }

  const labelsPayload = coerceLabelsEndpointResponse(raw);
  const merged = labelsPayload ?? coerceShipmondoShipmentRecord(raw);
  const b64 = extractShipmondoLabelBase64(merged);
  if (!b64) {
    return res.status(404).json({ message: "No label PDF available for this shipment" });
  }

  const buf = Buffer.from(b64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="shipping-label.pdf"');
  return res.send(buf);
};
