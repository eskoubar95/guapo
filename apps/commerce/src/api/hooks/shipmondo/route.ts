import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  parseShipmondoWebhookPayload,
  verifyShipmondoWebhookJwt,
} from "../../../modules/shipmondo/lib/webhook-jwt";

/**
 * Shipmondo pushes encrypted JWT webhooks (HS256). Configure in Shipmondo → Settings → Webhook.
 * URL: `https://<commerce-host>/hooks/shipmondo`
 * Encryption key: same value as `SHIPMONDO_WEBHOOK_ENCRYPTION_KEY` (env).
 *
 * @see https://shipmondo.dev/docs/webhooks/requirements-and-structure
 */
export const AUTHENTICATE = false;

type OrderRow = {
  id?: string;
  fulfillments?: Array<{
    id?: string;
    provider_id?: string;
    data?: Record<string, unknown> | null;
  }>;
};

function readString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== "") return String(v);
  }
  return "";
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const secret = process.env.SHIPMONDO_WEBHOOK_ENCRYPTION_KEY?.trim();
  if (!secret) {
    logger.warn("Shipmondo webhook: SHIPMONDO_WEBHOOK_ENCRYPTION_KEY not set — ignoring body");
    return res.status(200).json({ ok: true, configured: false });
  }

  const body = req.body as { data?: unknown } | undefined;
  const token = typeof body?.data === "string" ? body.data : null;
  if (!token) {
    return res.status(400).json({ message: "Expected JSON body with string property \"data\" (JWT)" });
  }

  let inner: ReturnType<typeof parseShipmondoWebhookPayload>;
  try {
    const jwtPayload = verifyShipmondoWebhookJwt(token, secret);
    inner = parseShipmondoWebhookPayload(jwtPayload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn(`Shipmondo webhook: JWT verify failed: ${msg}`);
    return res.status(401).json({ message: "Invalid webhook payload" });
  }

  const sm = inner.data;
  if (!sm || typeof sm !== "object") {
    return res.status(200).json({ ok: true });
  }

  const reference = readString(sm, ["reference", "order_id", "orderId"]);
  const pkgNo = readString(sm, ["pkg_no", "package_number"]);
  const trackingUrl = readString(sm, ["tracking_url", "trackingUrl"]);
  const resourceType = String(req.headers["smd-resource-type"] ?? "").toLowerCase();
  const resourceId = req.headers["smd-resource-id"];

  logger.info(
    `Shipmondo webhook: type=${resourceType || "?"} resource_id=${resourceId ?? "?"} reference=${reference || "?"}`
  );

  if (!reference || !reference.startsWith("order_")) {
    return res.status(200).json({ ok: true, skipped: "no_medusa_order_reference" });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  let orders: OrderRow[] = [];
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "fulfillments.id", "fulfillments.provider_id", "fulfillments.data"],
      filters: { id: reference },
    });
    orders = (data ?? []) as OrderRow[];
  } catch (e) {
    logger.warn(`Shipmondo webhook: query.graph order failed: ${e instanceof Error ? e.message : String(e)}`);
    return res.status(200).json({ ok: true, skipped: "order_query_failed" });
  }

  const order = orders[0];
  const fulfillments = order?.fulfillments ?? [];
  const shipmondoFulfillments = fulfillments.filter((f) =>
    String(f.provider_id ?? "").toLowerCase().includes("shipmondo")
  );
  const targets = shipmondoFulfillments.length > 0 ? shipmondoFulfillments : fulfillments;

  if (targets.length === 0) {
    return res.status(200).json({ ok: true, skipped: "no_fulfillments" });
  }

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as {
    updateFulfillment: (
      id: string,
      data: { data?: Record<string, unknown> }
    ) => Promise<unknown>;
  };

  for (const f of targets) {
    if (!f.id) continue;
    const prev = (f.data && typeof f.data === "object" ? f.data : {}) as Record<string, unknown>;
    const nextData: Record<string, unknown> = {
      ...prev,
      shipmondo_webhook_at: new Date().toISOString(),
    };
    if (pkgNo) nextData.shipmondo_pkg_no = pkgNo;
    if (trackingUrl) nextData.shipmondo_tracking_url = trackingUrl;
    if (resourceType) nextData.shipmondo_last_resource_type = resourceType;
    if (resourceId != null) nextData.shipmondo_last_resource_id = String(resourceId);

    try {
      await fulfillmentModule.updateFulfillment(f.id, { data: nextData });
    } catch (e) {
      logger.warn(
        `Shipmondo webhook: updateFulfillment ${f.id} failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return res.status(200).json({ ok: true, updated: targets.length });
};
