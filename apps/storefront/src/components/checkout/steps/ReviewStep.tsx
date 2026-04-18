"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { MapPin, RotateCw, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutPaymentMethodChoice } from "@/components/checkout-payment-types";
import type { PickupPoint } from "@/lib/pickup-points";
import { CollapsedSection } from "./CollapsedSection";
import type { CarrierCode } from "./checkout-utils";
import type { CheckoutFormData } from "./checkout-form.types";
import type { CheckoutStepNum } from "@/components/checkout/checkout-step-num";

interface ReviewStepProps {
  locale: string;
  checkout: Dictionary["checkout"];
  formData: CheckoutFormData;
  selectedCarrier: CarrierCode;
  selectedPoint: PickupPoint | null;
  onEditToStep: (step: CheckoutStepNum) => void;
  selectedPaymentMethod: CheckoutPaymentMethodChoice;
  onPaymentMethodChange?: (method: CheckoutPaymentMethodChoice) => void;
  /** When false, Klarna is not listed (launch default). */
  klarnaEnabled?: boolean;
  hasSubscriptionItems: boolean;
  termsAccepted: boolean;
  onTermsChange?: (accepted: boolean) => void;
  subscriptionTermsAccepted: boolean;
  onSubscriptionTermsChange?: (accepted: boolean) => void;
  onConfirm: () => void;
}

export function ReviewStep({
  locale,
  checkout,
  formData,
  selectedCarrier,
  selectedPoint,
  onEditToStep,
  selectedPaymentMethod,
  onPaymentMethodChange,
  klarnaEnabled = false,
  hasSubscriptionItems,
  termsAccepted,
  onTermsChange,
  subscriptionTermsAccepted,
  onSubscriptionTermsChange,
  onConfirm,
}: ReviewStepProps) {
  const paymentMethods: Array<{
    id: CheckoutPaymentMethodChoice;
    label: string;
    sub: string;
    icon: ReactNode;
    disabled?: boolean;
  }> = useMemo(
    () => {
      const base: Array<{
        id: CheckoutPaymentMethodChoice;
        label: string;
        sub: string;
        icon: ReactNode;
        disabled?: boolean;
      }> = [
        {
          id: "card",
          label: checkout.cardPaymentLabel,
          sub: checkout.cardPaymentNetworks,
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          id: "mobilepay",
          label: checkout.mobilePayLabel,
          sub: checkout.mobilePayPaymentSub,
          icon: <Smartphone className="h-5 w-5" />,
          disabled: hasSubscriptionItems,
        },
      ];
      if (klarnaEnabled) {
        base.push({
          id: "klarna",
          label: checkout.klarnaLabel,
          sub: checkout.klarnaPaymentSub,
          icon: <span className="text-sm font-bold leading-none">K.</span>,
          disabled: hasSubscriptionItems,
        });
      }
      return base;
    },
    [checkout, hasSubscriptionItems, klarnaEnabled]
  );

  return (
    <div className="space-y-5">
      <CollapsedSection title={checkout.yourInfo} editLabel={checkout.editInfo} onEdit={() => onEditToStep(1)}>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {formData.firstName} {formData.lastName}
          </p>
          <p className="text-muted-foreground">{formData.email}</p>
          {formData.address1 && (
            <p className="text-muted-foreground">
              {formData.address1}, {formData.postalCode} {formData.city}
            </p>
          )}
          {formData.phone && <p className="text-muted-foreground">{formData.phone}</p>}
        </div>
      </CollapsedSection>

      <CollapsedSection title={checkout.deliveryMethod} editLabel={checkout.editInfo} onEdit={() => onEditToStep(1)}>
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {selectedCarrier === "gls"
                ? checkout.glsPakkeshop
                : selectedCarrier === "dao"
                  ? checkout.daoPakkeshop
                  : checkout.postnordPakkeshop}
            </p>
            {selectedPoint && (
              <p className="text-muted-foreground mt-0.5">
                {selectedPoint.name}, {selectedPoint.address}, {selectedPoint.zipcode} {selectedPoint.city}
              </p>
            )}
          </div>
        </div>
      </CollapsedSection>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
          {checkout.paymentMethod}
        </h2>
        <div className="space-y-2.5">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              type="button"
              disabled={pm.disabled}
              onClick={() => {
                if (!pm.disabled) onPaymentMethodChange?.(pm.id);
              }}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-lg border-2 p-3.5 text-left transition-colors",
                pm.disabled
                  ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                  : selectedPaymentMethod === pm.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  selectedPaymentMethod === pm.id && !pm.disabled
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground"
                )}
              >
                {pm.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{pm.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pm.sub}</p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  selectedPaymentMethod === pm.id && !pm.disabled ? "border-primary" : "border-border"
                )}
              >
                {selectedPaymentMethod === pm.id && !pm.disabled && (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </span>
            </button>
          ))}
          {hasSubscriptionItems && (
            <p className="text-xs text-muted-foreground mt-2">
              <RotateCw className="inline h-3 w-3 mr-1 text-primary" />
              {checkout.subscriptionPaymentRestriction}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">{checkout.acceptTerms}</h2>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange?.(e.target.checked)}
            className="sr-only peer"
          />
          <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-[4px] border-[1.5px] border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1 shrink-0">
            {termsAccepted && (
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 6.5L4.5 9L10 3" />
              </svg>
            )}
          </span>
          <span className="text-sm text-muted-foreground leading-relaxed">
            {checkout.termsAcceptBeforeTermsLink}
            <Link
              href={`/${locale}/policies/terms`}
              className="font-medium text-primary hover:underline"
              target="_blank"
            >
              {checkout.termsLink}
            </Link>
            {checkout.termsAcceptAfterTermsBeforePrivacyLink}
            <Link
              href={`/${locale}/policies/privacy`}
              className="font-medium text-primary hover:underline"
              target="_blank"
            >
              {checkout.privacyLink}
            </Link>
            {checkout.termsAcceptAfterPrivacyLink}
          </span>
        </label>

        {hasSubscriptionItems && (
          <>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide pt-1">
              {checkout.acceptSubscriptionTerms}
            </h3>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subscriptionTermsAccepted}
                onChange={(e) => onSubscriptionTermsChange?.(e.target.checked)}
                className="sr-only peer"
              />
              <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-[4px] border-[1.5px] border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1 shrink-0">
                {subscriptionTermsAccepted && (
                  <svg
                    viewBox="0 0 12 12"
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6.5L4.5 9L10 3" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {checkout.subscriptionTermsText}{" "}
                <Link
                  href={`/${locale}/policies/terms`}
                  className="font-medium text-primary hover:underline"
                  target="_blank"
                >
                  {checkout.subscriptionTermsLink}
                </Link>
                .
              </span>
            </label>
          </>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!termsAccepted || (hasSubscriptionItems && !subscriptionTermsAccepted)}
          className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkout.confirmOrder}
        </button>
      </div>
    </div>
  );
}
