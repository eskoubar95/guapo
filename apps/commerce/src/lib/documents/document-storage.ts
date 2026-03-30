type OrderDocumentsState = {
  order_confirmation_pdf_base64?: string;
  invoice_pdf_base64?: string;
  generated_at?: string;
};

type TransactionalState = {
  order_confirmation_sent_at?: string;
  subscription_created_sent_at?: string;
  locale?: "da" | "en";
};

export type OrderMetadataState = {
  documents?: OrderDocumentsState;
  transactional?: TransactionalState;
  [key: string]: unknown;
};

export function readOrderMetadata(
  metadata: Record<string, unknown> | null | undefined
): OrderMetadataState {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as OrderMetadataState;
}

export function writeDocumentPayloads(
  metadata: Record<string, unknown> | null | undefined,
  values: {
    orderConfirmationPdfBase64: string;
    invoicePdfBase64: string;
    generatedAt: string;
  }
): OrderMetadataState {
  const current = readOrderMetadata(metadata);
  return {
    ...current,
    documents: {
      ...(current.documents ?? {}),
      order_confirmation_pdf_base64: values.orderConfirmationPdfBase64,
      invoice_pdf_base64: values.invoicePdfBase64,
      generated_at: values.generatedAt,
    },
  };
}

export function writeTransactionalMarker(
  metadata: Record<string, unknown> | null | undefined,
  values: Partial<TransactionalState>
): OrderMetadataState {
  const current = readOrderMetadata(metadata);
  return {
    ...current,
    transactional: {
      ...(current.transactional ?? {}),
      ...values,
    },
  };
}
