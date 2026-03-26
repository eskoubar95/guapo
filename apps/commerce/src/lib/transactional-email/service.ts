import { sendPlunkEmail } from "../plunk";
import { renderTransactionalTemplate } from "./templates";
import type { TransactionalEmailInput, TransactionalTemplate } from "./types";

type LoggerLike = {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
  error?: (msg: string) => void;
};

export async function sendTransactionalEmail<T extends TransactionalTemplate>(
  input: TransactionalEmailInput<T>,
  logger?: LoggerLike
): Promise<{ success: boolean; error?: string }> {
  const rendered = renderTransactionalTemplate(input.template, input.locale, input.payload);

  logger?.info?.(
    `[transactional-email] Sending template=${input.template} to=${input.to} locale=${input.locale} key=${input.idempotencyKey}`
  );

  const result = await sendPlunkEmail({
    to: input.to,
    subject: rendered.subject,
    body: rendered.html,
    data: {
      ...rendered.data,
      locale: input.locale,
      idempotency_key: input.idempotencyKey,
    },
    template: input.template,
  });

  if (!result.success) {
    const message = result.error?.message ?? "Unknown transactional email error";
    logger?.error?.(
      `[transactional-email] Failed template=${input.template} to=${input.to} key=${input.idempotencyKey}: ${message}`
    );
    return { success: false, error: message };
  }

  logger?.info?.(
    `[transactional-email] Sent template=${input.template} to=${input.to} key=${input.idempotencyKey}`
  );
  return { success: true };
}

export function resolveTransactionalLocale(input?: string | null): "da" | "en" {
  const normalized = String(input ?? "")
    .trim()
    .toLowerCase();
  if (normalized.startsWith("en")) return "en";
  return "da";
}
