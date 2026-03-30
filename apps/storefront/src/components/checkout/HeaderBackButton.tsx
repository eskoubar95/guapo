"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutStepNum } from "@/components/checkout/checkout-step-num";

interface HeaderBackButtonProps {
  show: boolean;
  currentStep: CheckoutStepNum;
  locale: string;
  dict: Dictionary;
  onBack: () => void;
}

export function HeaderBackButton({
  show,
  currentStep,
  locale,
  dict,
  onBack,
}: HeaderBackButtonProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("checkout-back-btn"));
  }, []);

  if (!portalTarget || !show) return null;

  const className =
    "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors";

  const backLabel = dict.checkout.previousStep;
  const content =
    currentStep === 1 ? (
      <Link href={`/${locale}/cart`} className={className} aria-label={backLabel}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{backLabel}</span>
      </Link>
    ) : (
      <button type="button" onClick={onBack} className={className} aria-label={backLabel}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{backLabel}</span>
      </button>
    );

  return createPortal(content, portalTarget);
}
