/**
 * Plunk email client (Next API).
 * Docs: https://next-wiki.useplunk.com/
 * Base URL: https://next-api.useplunk.com
 */

const PLUNK_API_BASE = "https://next-api.useplunk.com";

export type PlunkSendOptions = {
  to: string | { email: string; name?: string } | Array<string | { email: string; name?: string }>;
  subject: string;
  body: string;
  from?: string | { name: string; email: string };
  reply?: string;
  data?: Record<string, string>;
  template?: string;
};

export type PlunkSendResult = {
  success: boolean;
  data?: { emails?: unknown[]; timestamp?: string };
  error?: { code: string; message: string };
};

/**
 * Send a transactional email via Plunk Next API.
 * Requires PLUNK_SECRET_KEY (sk_*) in env. Optional: PLUNK_FROM_EMAIL for default sender.
 */
export async function sendPlunkEmail(options: PlunkSendOptions): Promise<PlunkSendResult> {
  const secretKey = process.env.PLUNK_SECRET_KEY;
  if (!secretKey) {
    console.warn("[Plunk] PLUNK_SECRET_KEY not set; skipping email. Set it in Railway Variables (server) or .env.");
    return { success: false, error: { code: "NO_KEY", message: "PLUNK_SECRET_KEY not set" } };
  }

  const from =
    options.from ??
    (process.env.PLUNK_FROM_EMAIL
      ? { name: process.env.PLUNK_FROM_NAME ?? "Guapo", email: process.env.PLUNK_FROM_EMAIL }
      : undefined);

  const body: Record<string, unknown> = {
    to: options.to,
    subject: options.subject,
    body: options.body,
    ...(from && { from }),
    ...(options.reply && { reply: options.reply }),
    ...(options.data && { data: options.data }),
    ...(options.template && { template: options.template }),
  };

  const res = await fetch(`${PLUNK_API_BASE}/v1/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as PlunkSendResult & { success?: boolean };
  if (!res.ok) {
    const err = data as { error?: { code: string; message: string } };
    console.error("[Plunk] send failed:", res.status, err?.error ?? data);
    return {
      success: false,
      error: err?.error ?? { code: "HTTP_ERROR", message: `HTTP ${res.status}` },
    };
  }
  return { success: true, data: data.data as PlunkSendResult["data"] };
}
