import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type DocumentsMeta = {
  order_confirmation_pdf_base64?: string;
  invoice_pdf_base64?: string;
  generated_at?: string;
};

type OrderWithMeta = {
  id?: string;
  metadata?: Record<string, unknown> | null;
};

function readDocuments(meta: Record<string, unknown> | null | undefined): DocumentsMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as { documents?: unknown }).documents;
  if (!raw || typeof raw !== "object") return null;
  return raw as DocumentsMeta;
}

async function downloadAdminPdf(orderId: string, type: "order-confirmation" | "invoice", filename: string) {
  const res = await fetch(
    `${BASE}/admin/orders/${encodeURIComponent(orderId)}/documents/${type}`,
    { credentials: "include" }
  );
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const OrderDocumentsWidget = ({ data }: DetailWidgetProps) => {
  const order = data as OrderWithMeta;
  const orderId = order?.id;
  const [resolved, setResolved] = useState<OrderWithMeta | null>(null);
  const [fetchDone, setFetchDone] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const fromProps = readDocuments(order?.metadata ?? undefined);
  const fromResolved = readDocuments(resolved?.metadata ?? undefined);
  const docs = fromResolved ?? fromProps;

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderId)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as { order?: OrderWithMeta };
      if (json.order) setResolved(json.order);
    } catch {
      /* ignore */
    }
  }, [orderId]);

  const regeneratePdfs = useCallback(async () => {
    if (!orderId) return;
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await fetch(
        `${BASE}/admin/orders/${encodeURIComponent(orderId)}/documents/regenerate`,
        { method: "POST", credentials: "include" }
      );
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setRegenerateError(typeof json.message === "string" ? json.message : "Regeneration failed");
        return;
      }
      await load();
    } catch {
      setRegenerateError("Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }, [orderId, load]);

  useEffect(() => {
    if (!orderId) {
      setFetchDone(true);
      return;
    }
    const hasDocKeys =
      typeof fromProps?.order_confirmation_pdf_base64 === "string" ||
      typeof fromProps?.invoice_pdf_base64 === "string";
    if (hasDocKeys) {
      setFetchDone(true);
      return;
    }
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setFetchDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId, fromProps?.order_confirmation_pdf_base64, fromProps?.invoice_pdf_base64, load]);

  const hasConfirmation = typeof docs?.order_confirmation_pdf_base64 === "string";
  const hasInvoice = typeof docs?.invoice_pdf_base64 === "string";

  if (!orderId) {
    return null;
  }

  if (!fetchDone) {
    return (
      <Container className="p-4">
        <p className="text-sm text-ui-fg-muted">Loading documents…</p>
      </Container>
    );
  }

  const displayHint = docs?.generated_at
    ? `Generated ${new Date(docs.generated_at).toLocaleString()}`
    : "PDFs are stored on the order. Regenerate after layout or seller data changes.";

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-2 text-sm font-semibold">
          Order PDFs
        </Heading>
        <Text size="small" className="mb-3 text-ui-fg-muted">
          {displayHint}
        </Text>
        {!hasConfirmation && !hasInvoice && (
          <Text size="small" className="mb-3 text-ui-fg-subtle">
            No PDFs in metadata yet. Use Regenerate to build them with the current template and seller
            settings (region metadata / env).
          </Text>
        )}
        {regenerateError && (
          <Text size="small" className="mb-2 text-ui-fg-error">
            {regenerateError}
          </Text>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="small"
            type="button"
            isLoading={regenerating}
            disabled={regenerating}
            onClick={() => void regeneratePdfs()}
          >
            Regenerate PDFs
          </Button>
          {hasConfirmation && (
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={() =>
                downloadAdminPdf(orderId, "order-confirmation", `order-confirmation-${orderId.slice(-8)}.pdf`)
              }
            >
              Download order confirmation
            </Button>
          )}
          {hasInvoice && (
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={() => downloadAdminPdf(orderId, "invoice", `invoice-${orderId.slice(-8)}.pdf`)}
            >
              Download invoice
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default OrderDocumentsWidget;
