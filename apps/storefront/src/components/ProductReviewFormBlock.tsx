"use client";

import { useState } from "react";
import { ProductReviewForm } from "./ProductReviewForm";

interface ProductReviewFormBlockProps {
  productId: string;
  locale: string;
  labels: {
    writeReview: string;
    writeReviewTitle: string;
    headline: string;
    headlinePlaceholder: string;
    reviewText: string;
    reviewTextPlaceholder: string;
    submitReview: string;
    loginToReview: string;
    loginLink: string;
    submitting: string;
    errorSubmit: string;
    successSubmit: string;
  };
  onSuccess?: () => void;
}

export function ProductReviewFormBlock({
  productId,
  locale,
  labels,
  onSuccess,
}: ProductReviewFormBlockProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {labels.writeReview}
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <ProductReviewForm
            productId={productId}
            locale={locale}
            labels={labels}
            onSuccess={() => {
              setShowForm(false);
              onSuccess?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
