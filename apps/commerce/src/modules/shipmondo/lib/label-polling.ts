import type { Logger } from "@medusajs/framework/types";

import {
  coerceLabelsEndpointResponse,
  coerceShipmondoShipmentRecord,
  debugLogShipmondoShipmentLabelShape,
  extractShipmondoLabellessCode,
  resolveMedusaLabelUrlFromShipmondoShipment,
} from "./labels";
import { parsePositiveIntCapped, shipmondoLabelPollDelayMs, sleepMs } from "./env";

export type ShipmondoHttpRequest = <T>(
  method: string,
  path: string,
  body?: object
) => Promise<T>;

/**
 * Polls Shipmondo until a label URL/base64 is available or attempts exhausted.
 */
export async function pollShipmondoForLabel(
  logger: Logger,
  request: ShipmondoHttpRequest,
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
      const labelsRaw = await request<unknown>("GET", labelsPath);
      const labelsPayload = coerceLabelsEndpointResponse(labelsRaw);
      if (labelsPayload) {
        labelPayload = { ...shipment, ...labelsPayload };
        debugLogShipmondoShipmentLabelShape(
          logger,
          labelPayload,
          `GET ${labelsPath} (label poll ${attempt + 1}/${maxAttempts})`
        );
        if (resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) break;
      }
    } catch {
      try {
        const gotRaw = await request<unknown>("GET", `/shipments/${shipmentNumericId}`);
        const got = coerceShipmondoShipmentRecord(gotRaw);
        debugLogShipmondoShipmentLabelShape(
          logger,
          got,
          `GET /shipments/${shipmentNumericId} (label poll fallback ${attempt + 1}/${maxAttempts})`
        );
        if (Object.keys(got).length > 0) labelPayload = got;
        if (resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) break;
      } catch (e2) {
        logger.warn(
          `Shipmondo: label poll ${attempt + 1}/${maxAttempts} failed: ${e2 instanceof Error ? e2.message : String(e2)}`
        );
      }
    }
  }

  if (!resolveMedusaLabelUrlFromShipmondoShipment(labelPayload)) {
    const labelless = extractShipmondoLabellessCode(labelPayload);
    if (labelless) {
      logger.info(
        `Shipmondo: shipment ${shipmentNumericId} has no label PDF in JSON (labelless / E-label flow). ` +
          `labelless_code is stored on fulfillment data. pkg/tracking: ${pkgNo ?? "—"} / ${trackingUrl || "—"}. ` +
          "For a downloadable PDF in some setups, try SHIPMONDO_SHIPMENT_PRINT=true or use Shipmondo UI."
      );
    } else {
      logger.warn(
        `Shipmondo: no label PDF/URL in POST/GET after ${maxAttempts} attempt(s) for shipment ${shipmentNumericId}. ` +
          "Carrier may expose the label only in the Shipmondo UI for a short delay; try getFulfillmentDocuments later or increase SHIPMONDO_LABEL_GET_MAX_ATTEMPTS / SHIPMONDO_LABEL_GET_RETRY_MS."
      );
    }
  }

  return labelPayload;
}
