import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 40;

const buckets = new Map<string, { count: number; windowStart: number }>();

function maxRequests(): number {
  const raw = process.env.ORDER_DOCUMENTS_RATE_LIMIT_MAX?.trim();
  if (!raw) return DEFAULT_MAX;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 1000) : DEFAULT_MAX;
}

function clientKey(req: MedusaRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const first = typeof xf === "string" ? xf.split(",")[0]?.trim() : "";
  return first || req.socket?.remoteAddress || "unknown";
}

export function storeOrderDocumentsRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  if (process.env.ORDER_DOCUMENTS_RATE_LIMIT_DISABLED === "true") {
    next();
    return;
  }

  const now = Date.now();
  const key = clientKey(req);
  const limit = maxRequests();

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    res.setHeader("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));
    res.status(429).json({
      message: "Too many document download attempts. Try again shortly.",
      code: "RATE_LIMITED",
    });
    return;
  }

  next();
}
