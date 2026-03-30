import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 120;

const buckets = new Map<string, { count: number; windowStart: number }>();

function maxRequests(): number {
  const raw = process.env.SHIPMONDO_STORE_RATE_LIMIT_MAX?.trim();
  if (!raw) return DEFAULT_MAX;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 2000) : DEFAULT_MAX;
}

function clientKey(req: MedusaRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const first = typeof xf === "string" ? xf.split(",")[0]?.trim() : "";
  const ip = first || req.socket?.remoteAddress || "unknown";
  return ip;
}

/**
 * Soft rate limit for Shipmondo-related store proxies (pickup points, shipping pricing).
 * Disabled when `SHIPMONDO_STORE_RATE_LIMIT_DISABLED=true`.
 */
export function storeShipmondoRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  if (process.env.SHIPMONDO_STORE_RATE_LIMIT_DISABLED === "true") {
    next();
    return;
  }
  const now = Date.now();
  const key = clientKey(req);
  const limit = maxRequests();
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    b = { count: 0, windowStart: now };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) {
    res.setHeader("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));
    res.status(429).json({
      message: "Too many requests. Try again shortly.",
      code: "RATE_LIMITED",
    });
    return;
  }
  next();
}
