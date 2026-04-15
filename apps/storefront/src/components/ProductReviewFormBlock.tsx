"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductReviewForm } from "./ProductReviewForm";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ProductReviewFormBlockProps {
  productId: string;
  locale: string;
  labels: {
    writeReview: string;
    writeReviewTitle: string;
    ratingLabel: string;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {labels.writeReview}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className="w-full sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{labels.writeReviewTitle}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <ProductReviewForm
              productId={productId}
              locale={locale}
              hideTitle
              labels={{
                writeReviewTitle: labels.writeReviewTitle,
                ratingLabel: labels.ratingLabel,
                headline: labels.headline,
                headlinePlaceholder: labels.headlinePlaceholder,
                reviewText: labels.reviewText,
                reviewTextPlaceholder: labels.reviewTextPlaceholder,
                submitReview: labels.submitReview,
                loginToReview: labels.loginToReview,
                loginLink: labels.loginLink,
                submitting: labels.submitting,
                errorSubmit: labels.errorSubmit,
                successSubmit: labels.successSubmit,
              }}
              onSuccess={() => {
                router.refresh();
                setOpen(false);
                onSuccess?.();
              }}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
