/**
 * Connectivity check for Shipmondo API (sandbox or production).
 * Run: pnpm verify:shipmondo  (from apps/commerce)
 *
 * Validates env and performs GET /products?country_code=DK — same base URL as fulfillment module.
 */
import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

function baseUrl(): string {
  return process.env.SHIPMONDO_SANDBOX === "true"
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

export default async function verifyShipmondoSandbox({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Shipmondo API connectivity check");
  logger.info(`  SHIPMONDO_SANDBOX=${process.env.SHIPMONDO_SANDBOX === "true" ? "true" : "false (production URL)"}`);
  logger.info(`  Base URL: ${baseUrl()}`);

  const user = process.env.SHIPMONDO_API_USER?.trim();
  const key = process.env.SHIPMONDO_API_KEY?.trim();
  if (!user || !key) {
    logger.warn("Skip API call: set SHIPMONDO_API_USER and SHIPMONDO_API_KEY for GET /products test.");
    logger.info("E2E checklist: see apps/commerce/docs/SHIPMONDO.md → Sandbox E2E & go-live.");
    return;
  }

  const auth = Buffer.from(`${user}:${key}`).toString("base64");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${baseUrl()}/products?country_code=DK`, {
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    });
    const text = await res.text();
    logger.info(`GET /products?country_code=DK → HTTP ${res.status}`);
    if (!res.ok) {
      logger.warn(`Response (truncated): ${text.slice(0, 400)}`);
      if (res.status === 401) {
        logger.warn("401: wrong credentials or production keys used against sandbox (or vice versa).");
      }
    } else {
      logger.info("Credentials accepted. Next: checkout → order → Admin fulfillment → label.");
    }
  } catch (e) {
    logger.error(`Request failed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    clearTimeout(t);
  }
}
