"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";

interface PaymentStepProps {
  checkout: Dictionary["checkout"];
  paymentContent?: ReactNode;
  paymentProcessing: boolean;
  onBackToReview: () => void;
}

export function PaymentStep({
  checkout,
  paymentContent,
  paymentProcessing,
  onBackToReview,
}: PaymentStepProps) {
  return (
    <>
      <div className={cn("space-y-5", paymentProcessing && "invisible h-0 overflow-hidden")}>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">
            {checkout.paymentMethod}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">{checkout.paymentDetailsHint}</p>
          <div>{paymentContent}</div>
        </div>

        <button
          type="button"
          onClick={onBackToReview}
          className="rounded-lg border border-border bg-background px-6 py-3.5 text-sm font-medium text-foreground hover:bg-surface hover:border-primary/40 transition-colors"
        >
          {checkout.previousStep}
        </button>
      </div>

      {paymentProcessing && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/98"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-5 text-center px-6">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
              <Lock className="absolute inset-0 m-auto h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{checkout.processingPaymentTitle}</p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                {checkout.processingPaymentSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
