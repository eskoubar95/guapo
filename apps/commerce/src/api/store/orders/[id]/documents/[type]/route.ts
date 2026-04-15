import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getOrderDocumentBase64,
  type OrderDocumentType,
} from "../../../../../../lib/documents/document-storage";

type OrderDocumentRow = {
  id: string;
  display_id?: number;
  customer_id?: string;
  metadata?: Record<string, unknown> | null;
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } }).auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({ message: "Login required", code: "UNAUTHORIZED" });
  }

  const orderId = req.params?.id;
  const type = req.params?.type as OrderDocumentType | undefined;
  if (!orderId || (type !== "order-confirmation" && type !== "invoice")) {
    return res.status(400).json({ message: "Invalid order or document type", code: "BAD_REQUEST" });
  }

  const query = req.scope.resolve("query") as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "customer_id", "metadata"],
    filters: { id: orderId },
  });

  const order = data?.[0] as OrderDocumentRow | undefined;
  if (!order) {
    return res.status(404).json({ message: "Order not found", code: "ORDER_NOT_FOUND" });
  }
  if (order.customer_id !== authContext.actor_id) {
    return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
  }

  const payload = getOrderDocumentBase64(order.metadata, type);
  if (!payload) {
    return res.status(404).json({ message: "Document not available", code: "DOCUMENT_NOT_FOUND" });
  }

  const fileLabel = type === "order-confirmation" ? "order-confirmation" : "invoice";
  const orderLabel = order.display_id != null ? String(order.display_id) : order.id;
  const binary = Buffer.from(payload, "base64");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileLabel}-${orderLabel.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf"`
  );
  res.send(binary);
};
