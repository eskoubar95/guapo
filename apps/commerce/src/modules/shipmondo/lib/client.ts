import type { Logger } from "@medusajs/framework/types";

import {
  DEFAULT_SHIPMONDO_REQUEST_TIMEOUT_MS,
  DEFAULT_SHIPMONDO_SHIPMENT_POST_TIMEOUT_MS,
  parsePositiveTimeoutMs,
} from "./env";

function requestTimeoutMs(method: string, path: string): number {
  if (method === "POST" && path === "/shipments") {
    return parsePositiveTimeoutMs("SHIPMONDO_SHIPMENT_TIMEOUT_MS", DEFAULT_SHIPMONDO_SHIPMENT_POST_TIMEOUT_MS);
  }
  return parsePositiveTimeoutMs("SHIPMONDO_REQUEST_TIMEOUT_MS", DEFAULT_SHIPMONDO_REQUEST_TIMEOUT_MS);
}

export async function shipmondoRequest<T>(
  baseUrl: string,
  apiUser: string,
  apiKey: string,
  logger: Logger,
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const url = `${baseUrl}${path}`;
  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
  const timeoutMs = requestTimeoutMs(method, path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && (e.name === "AbortError" || /aborted/i.test(e.message));
    if (aborted) {
      throw new Error(
        `Shipmondo request timed out after ${timeoutMs}ms (${method} ${path}). ` +
          "If this was POST /shipments, the shipment may already exist in Shipmondo — check the dashboard before creating another fulfillment."
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text();
    const safeMsg = text.slice(0, 300);
    logger.warn(`Shipmondo API ${method} ${path}: ${res.status}`);
    throw new Error(`Shipmondo API error: ${res.status} ${safeMsg}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
