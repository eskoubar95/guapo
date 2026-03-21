import type { Logger } from "@medusajs/framework/types";

/** Shipmondo returns PDF (or other) in `labels[].base64`; some responses may still use legacy `label_base64`. */
type ShipmondoShipmentLabelEntry = { base64?: string; file_format?: string };

/** Some API clients wrap the shipment as `{ shipment: { ... } }` or `{ data: { ... } }`. */
export function coerceShipmondoShipmentRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const root = raw as Record<string, unknown>;
  const looksLikeShipment =
    root.labels != null ||
    root.pkg_no != null ||
    root.id != null ||
    root.carrier_code != null ||
    root.product_code != null;
  if (looksLikeShipment) return root;

  const wrapped = root.shipment;
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    return wrapped as Record<string, unknown>;
  }
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (d.labels != null || d.id != null || d.pkg_no != null || d.carrier_code != null) {
      return d;
    }
  }
  return root;
}

function labelObjectBase64String(item: object): string | undefined {
  const o = item as Record<string, unknown>;
  for (const key of ["base64", "Base64", "label_base64", "pdf_base64", "content", "data"]) {
    const v = o[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function extractBase64FromLabelsArray(labels: unknown): string | undefined {
  if (!Array.isArray(labels)) return undefined;
  for (const item of labels) {
    if (item != null && typeof item === "object") {
      const b = labelObjectBase64String(item);
      if (b) return b;
    }
  }
  return undefined;
}

function extractHttpsUrlFromLabelsArray(labels: unknown): string | undefined {
  if (!Array.isArray(labels)) return undefined;
  for (const item of labels) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    for (const key of ["url", "pdf_url", "label_url", "href", "download_url"]) {
      const v = o[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    }
  }
  return undefined;
}

/** Prefer `labels[]` on the shipment; some carrier responses nest PDF under `parcels[].labels` or `parcels[].label_base64`. */
export function extractShipmondoLabelBase64(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const legacy = payload.label_base64;
  if (typeof legacy === "string" && legacy.length > 0) return legacy;
  const fromTop = extractBase64FromLabelsArray(payload.labels);
  if (fromTop) return fromTop;
  const single = payload.label;
  if (single && typeof single === "object" && !Array.isArray(single)) {
    const b = labelObjectBase64String(single as object);
    if (b) return b;
  }
  const parcels = payload.parcels;
  if (!Array.isArray(parcels)) return undefined;
  for (const parcel of parcels) {
    if (parcel == null || typeof parcel !== "object") continue;
    const p = parcel as Record<string, unknown>;
    const pb = p.label_base64;
    if (typeof pb === "string" && pb.length > 0) return pb;
    const fromPl = extractBase64FromLabelsArray(p.labels);
    if (fromPl) return fromPl;
    const plab = p.label;
    if (plab && typeof plab === "object" && !Array.isArray(plab)) {
      const b = labelObjectBase64String(plab as object);
      if (b) return b;
    }
  }
  return undefined;
}

/** Prefer a normal HTTPS label URL when Shipmondo returns one (smaller than data: URLs in DB). */
function extractShipmondoLabelHttpsUrl(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const top = extractHttpsUrlFromLabelsArray(payload.labels);
  if (top) return top;
  const single = payload.label;
  if (single && typeof single === "object" && !Array.isArray(single)) {
    const o = single as Record<string, unknown>;
    for (const key of ["url", "pdf_url", "label_url", "href", "download_url"]) {
      const v = o[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    }
  }
  const parcels = payload.parcels;
  if (!Array.isArray(parcels)) return undefined;
  for (const parcel of parcels) {
    if (parcel == null || typeof parcel !== "object") continue;
    const p = parcel as Record<string, unknown>;
    const fromPl = extractHttpsUrlFromLabelsArray(p.labels);
    if (fromPl) return fromPl;
    for (const key of ["label_url", "pdf_url", "url"] as const) {
      const v = p[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    }
  }
  return undefined;
}

/** First non-empty `labels` array (shipment or parcel) — used for MIME type from `file_format`. */
function firstShipmondoLabelsArrayForMime(payload: Record<string, unknown> | undefined): unknown {
  if (!payload) return undefined;
  if (Array.isArray(payload.labels) && payload.labels.length > 0) return payload.labels;
  const parcels = payload.parcels;
  if (!Array.isArray(parcels)) return undefined;
  for (const parcel of parcels) {
    if (parcel != null && typeof parcel === "object") {
      const pl = (parcel as Record<string, unknown>).labels;
      if (Array.isArray(pl) && pl.length > 0) return pl;
    }
  }
  return undefined;
}

/**
 * Labelless / E-label (fx dao, Bring): Shipmondo returns no `labels[].base64` — use code on the package.
 * See https://shipmondo.com/dictionary/labelless/
 */
export function extractShipmondoLabellessCode(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const r = payload.labelless_code;
  if (typeof r === "string" && r.trim() !== "") return r.trim();
  const parcels = payload.parcels;
  if (!Array.isArray(parcels)) return undefined;
  for (const p of parcels) {
    if (p != null && typeof p === "object") {
      const lc = (p as Record<string, unknown>).labelless_code;
      if (typeof lc === "string" && lc.trim() !== "") return lc.trim();
    }
  }
  return undefined;
}

/** Logs structure only (keys, counts) — never base64 or secrets. Enable with SHIPMONDO_DEBUG_SHIPMENT_RESPONSE=true. */
export function debugLogShipmondoShipmentLabelShape(
  logger: Logger,
  payload: Record<string, unknown>,
  context: string
): void {
  if (process.env.SHIPMONDO_DEBUG_SHIPMENT_RESPONSE !== "true") return;
  const keys = Object.keys(payload).sort();
  const labels = payload.labels;
  const parcels = payload.parcels;
  let parcelSummary = "";
  if (Array.isArray(parcels)) {
    parcelSummary = parcels
      .slice(0, 4)
      .map((p, i) => {
        if (p == null || typeof p !== "object") return `${i}:null`;
        return `${i}:{${Object.keys(p as Record<string, unknown>).sort().join(",")}}`;
      })
      .join(" | ");
  }
  const labelsDesc = Array.isArray(labels) ? `labels[len=${labels.length}]` : `labels=${String(labels)}`;
  const parcelsDesc = Array.isArray(parcels)
    ? `parcels[count=${parcels.length}] ${parcelSummary}`
    : `parcels=${String(parcels)}`;
  const labellessHint = extractShipmondoLabellessCode(payload) ? "yes" : "no";
  logger.info(
    `Shipmondo debug [${context}]: topKeys=[${keys.join(",")}] ${labelsDesc} ${parcelsDesc} labelless_code=${labellessHint}`
  );
}

function mimeTypeForShipmondoLabel(labels: unknown): string {
  if (!Array.isArray(labels) || labels.length === 0) return "application/pdf";
  const first = labels[0];
  if (first == null || typeof first !== "object") return "application/pdf";
  const fmt = String((first as ShipmondoShipmentLabelEntry).file_format ?? "")
    .toLowerCase()
    .replace(/^\./, "");
  if (fmt === "png") return "image/png";
  if (fmt === "pdf" || fmt === "") return "application/pdf";
  return "application/octet-stream";
}

function shipmondoLabelDataUrl(payload: Record<string, unknown> | undefined): string {
  const b64 = extractShipmondoLabelBase64(payload);
  if (!b64) return "";
  const mime = mimeTypeForShipmondoLabel(firstShipmondoLabelsArrayForMime(payload) ?? payload?.labels);
  return `data:${mime};base64,${b64}`;
}

export function resolveMedusaLabelUrlFromShipmondoShipment(payload: Record<string, unknown> | undefined): string {
  if (!payload) return "";
  const https = extractShipmondoLabelHttpsUrl(payload);
  if (https) return https;
  return shipmondoLabelDataUrl(payload);
}

/**
 * Parse the response from `GET /shipments/{id}/labels`.
 * The endpoint may return a raw array `[{base64, file_format}]` or a wrapper `{labels: [...]}`.
 * Returns a synthetic payload compatible with `resolveMedusaLabelUrlFromShipmondoShipment`.
 */
export function coerceLabelsEndpointResponse(raw: unknown): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw) && raw.length > 0) {
    return { labels: raw };
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.labels) && obj.labels.length > 0) return obj;
    const b64 = obj.base64;
    if (typeof b64 === "string" && b64.length > 0) return { labels: [obj] };
  }
  return undefined;
}

/**
 * Medusa Admin uses `label_url` as `href` for a "Label" link. `data:application/pdf;base64,...` often opens a blank/black tab
 * (browser limits / PDF-in-data-URL). Prefer HTTPS from Shipmondo, else same-origin PDF proxy when `MEDUSA_BACKEND_URL` is set.
 */
export function resolveLabelUrlForMedusaAdmin(
  labelPayload: Record<string, unknown>,
  shipmentNumericId: number | null | undefined
): string {
  const https = extractShipmondoLabelHttpsUrl(labelPayload);
  if (https) return https;
  const hasPdf = !!extractShipmondoLabelBase64(labelPayload);
  if (!hasPdf) return "";
  const base = process.env.MEDUSA_BACKEND_URL?.trim().replace(/\/$/, "") ?? "";
  if (base && shipmentNumericId != null && Number.isFinite(shipmentNumericId)) {
    return `${base}/admin/shipmondo/shipments/${shipmentNumericId}/label`;
  }
  return shipmondoLabelDataUrl(labelPayload);
}

/**
 * Dashboard shows the package id as link text only when `tracking_url` is non-empty (@medusajs/dashboard order-fulfillment-section).
 */
export function fallbackTrackingUrlForMedusaAdmin(
  trackingUrl: string,
  pkgNo: string | undefined,
  carrierCode: string | undefined
): string {
  if (trackingUrl && trackingUrl.trim() !== "") return trackingUrl;
  if (!pkgNo) return "";
  const c = (carrierCode ?? "").toLowerCase();
  if (c.includes("gls")) {
    return `https://gls-group.eu/GROUP/en/parcel-tracking?match=${encodeURIComponent(pkgNo)}`;
  }
  return "https://www.shipmondo.com";
}

export function extractShipmondoGlsColliId(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const parcels = payload.parcels;
  if (!Array.isArray(parcels)) return undefined;
  for (const p of parcels) {
    if (p != null && typeof p === "object") {
      const id = (p as Record<string, unknown>).gls_colli_id;
      if (id != null && String(id).trim() !== "") return String(id).trim();
    }
  }
  return undefined;
}

/** Shipmondo `id` is numeric in docs; coerce if JSON ever returns a string. */
export function parseShipmondoShipmentId(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

// Re-export for callers that imported `shipmondoLabelFormat` alongside label helpers from `service`.
export { shipmondoLabelFormat } from "./env";
