"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutStepNum } from "@/components/checkout/checkout-step-num";

const STEPS: { num: CheckoutStepNum; labelKey: "shipping" | "review" | "payment" }[] = [
  { num: 1, labelKey: "shipping" },
  { num: 2, labelKey: "review" },
  { num: 3, labelKey: "payment" },
];

interface CheckoutStepIndicatorProps {
  checkout: Dictionary["checkout"];
  currentStep: CheckoutStepNum;
  paymentProcessing: boolean;
}

export function CheckoutStepIndicator({
  checkout,
  currentStep,
  paymentProcessing,
}: CheckoutStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-6">
      {STEPS.map((s, idx) => {
        const visualStep = paymentProcessing ? 3 : currentStep;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs sm:text-sm font-medium transition-colors",
                  visualStep > s.num
                    ? "border-primary bg-primary text-primary-foreground"
                    : visualStep === s.num
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground"
                )}
              >
                {visualStep > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium whitespace-nowrap",
                  visualStep >= s.num ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {checkout[s.labelKey]}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 sm:w-14 lg:w-20",
                  visualStep > s.num ? "bg-primary" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
