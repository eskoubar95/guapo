"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { medusa } from "@/lib/medusa";

export type OrderDocumentType = "order-confirmation" | "invoice";

type OrderDocumentDownloadLinkProps = {
  orderId: string;
  docType: OrderDocumentType;
  locale?: string;
  children: React.ReactNode;
  className?: string;
} & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "onClick" | "children"
>;

/**
 * Downloads order PDF via Medusa store API (publishable key + session on the Medusa origin).
 * A same-origin Next proxy cannot forward customer session when auth lives on the backend domain.
 */
export function OrderDocumentDownloadLink({
  orderId,
  docType,
  locale = "da",
  children,
  className,
  ...anchorRest
}: OrderDocumentDownloadLinkProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      const path = `/store/orders/${encodeURIComponent(orderId)}/documents/${docType}`;
      try {
        // SDK adds publishable key + Bearer JWT (localStorage). Non-2xx throws FetchError before returning.
        const res = (await medusa.client.fetch(path, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/pdf" },
          cache: "no-store",
        })) as Response;
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        // Programmatic <a download> stays within the user-gesture chain; window.open(blob) after await is often blocked.
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download =
          docType === "invoice"
            ? `invoice-${orderId.slice(0, 8)}.pdf`
            : `order-confirmation-${orderId.slice(0, 8)}.pdf`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
      } catch {
        toast.error(
          locale === "da"
            ? "Kunne ikke hente PDF."
            : "Could not download PDF."
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, docType, locale, orderId]
  );

  return (
    <a
      href="#"
      role="button"
      className={className}
      aria-busy={busy}
      {...anchorRest}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
