import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";
import {
  buildOrderDocumentPdfBuffers,
  getOrderDocumentGraphFields,
  type OrderShapeForDocuments,
} from "../../../../../../lib/documents/order-document-generation";
import { resolvePdfSellerForOrder } from "../../../../../../lib/documents/resolve-pdf-seller";
import { writeDocumentPayloads } from "../../../../../../lib/documents/document-storage";

/**
 * POST /admin/orders/:id/documents/regenerate
 * Rebuilds order + invoice PDFs with **current** code and seller config (region metadata + env).
 * Does **not** send e-mails again. Use after layout/sælgerdata-ændringer or for gamle ordrer med gamle PDFs i metadata.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const orderId = req.params?.id;
  if (!orderId) {
    return res.status(400).json({ message: "Order id required", code: "BAD_REQUEST" });
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
    fields: [...getOrderDocumentGraphFields()],
    filters: { id: orderId },
  });

  const order = data?.[0] as OrderShapeForDocuments | undefined;
  if (!order?.id) {
    return res.status(404).json({ message: "Order not found", code: "ORDER_NOT_FOUND" });
  }

  try {
    const seller = await resolvePdfSellerForOrder(req.scope, order.currency_code ?? "dkk");
    const { orderConfirmationPdf, invoicePdf, generatedAt } = await buildOrderDocumentPdfBuffers(
      order,
      seller
    );

    const mergedMetadata = writeDocumentPayloads(order.metadata, {
      orderConfirmationPdfBase64: orderConfirmationPdf.toString("base64"),
      invoicePdfBase64: invoicePdf.toString("base64"),
      generatedAt,
    });

    await updateOrderWorkflow(req.scope).run({
      input: {
        id: orderId,
        user_id: order.customer_id ?? orderId,
        metadata: mergedMetadata,
      },
    });

    return res.status(200).json({
      ok: true,
      generated_at: generatedAt,
      message: "PDFs regenerated. Download again to see the new files.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/orders/:id/documents/regenerate]", e);
    return res.status(500).json({
      message: "Failed to regenerate PDFs",
      code: "REGENERATE_FAILED",
      detail: msg,
    });
  }
};
