"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import type { CheckoutPaymentMethodChoice } from "./checkout-payment-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutStepNum } from "@/components/checkout/checkout-step-num";
import { ContactForm } from "@/components/checkout/steps/ContactForm";
import { DeliveryStep } from "@/components/checkout/steps/DeliveryStep";
import { ReviewStep } from "@/components/checkout/steps/ReviewStep";
import { PaymentStep } from "@/components/checkout/steps/PaymentStep";
import { PickupPointSheet } from "@/components/checkout/steps/PickupPointSheet";
import type { CheckoutFormData } from "@/components/checkout/steps/checkout-form.types";
import {
  DEFAULT_CHECKOUT_FORM_DATA,
  canConfirmCheckoutContact,
} from "@/components/checkout/steps/checkout-form-defaults";
import { useCheckoutPickup } from "@/components/checkout/hooks/useCheckoutPickup";
import { CheckoutStepIndicator } from "@/components/checkout/CheckoutStepIndicator";

export type { CheckoutStepNum } from "@/components/checkout/checkout-step-num";

interface CheckoutStepsProps {
  locale: string;
  dict: Dictionary;
  onStepChange?: (step: CheckoutStepNum) => void;
  paymentContent?: React.ReactNode;
  paymentProcessing?: boolean;
  shippingOptions?: ShippingOption[];
  selectedShippingOptionId?: string | null;
  onShippingSelect?: (optionId: string, data: Record<string, unknown>) => void;
  formData?: CheckoutFormData;
  onFormDataChange?: (data: CheckoutFormData) => void;
  initialPickupZipcode?: string;
  initialPickupPointId?: string;
  termsAccepted?: boolean;
  onTermsChange?: (accepted: boolean) => void;
  subscriptionTermsAccepted?: boolean;
  onSubscriptionTermsChange?: (accepted: boolean) => void;
  hasSubscriptionItems?: boolean;
  isGuest?: boolean;
  onRegisterGoToStep?: (fn: (step: CheckoutStepNum) => void) => void;
  selectedPaymentMethod?: CheckoutPaymentMethodChoice;
  onPaymentMethodChange?: (method: CheckoutPaymentMethodChoice) => void;
}

export function CheckoutSteps({
  locale,
  dict,
  onStepChange,
  paymentContent,
  paymentProcessing = false,
  shippingOptions = [],
  selectedShippingOptionId = null,
  onShippingSelect,
  formData = DEFAULT_CHECKOUT_FORM_DATA,
  onFormDataChange,
  initialPickupZipcode = "",
  initialPickupPointId = "",
  termsAccepted = false,
  onTermsChange,
  subscriptionTermsAccepted = false,
  onSubscriptionTermsChange,
  hasSubscriptionItems = false,
  isGuest = false,
  onRegisterGoToStep,
  selectedPaymentMethod = "card",
  onPaymentMethodChange,
}: CheckoutStepsProps) {
  const [step, setStep] = useState<CheckoutStepNum>(1);
  const [contactConfirmed, setContactConfirmed] = useState(false);
  const { checkout } = dict;

  const {
    searchAddress,
    setSearchAddress,
    pickupPoints,
    pickupLoading,
    selectedPoint,
    sheetOpen,
    setSheetOpen,
    selectPoint,
    getOptionForCarrier,
    pakkeshopOption,
    selectedCarrier,
  } = useCheckoutPickup({
    shippingOptions,
    formData,
    initialPickupZipcode,
    initialPickupPointId,
    onShippingSelect,
  });

  const handleStepChange = useCallback(
    (newStep: CheckoutStepNum) => {
      setStep(newStep);
      onStepChange?.(newStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onStepChange]
  );

  useEffect(() => {
    onRegisterGoToStep?.(handleStepChange);
  }, [onRegisterGoToStep, handleStepChange]);

  const canConfirmContact = canConfirmCheckoutContact(formData);

  return (
    <>
      <CheckoutStepIndicator
        checkout={checkout}
        currentStep={step}
        paymentProcessing={paymentProcessing}
      />

      {step === 1 && (
        <div className="space-y-5">
          {!contactConfirmed ? (
            <ContactForm
              formData={formData}
              onFormDataChange={onFormDataChange}
              checkout={checkout}
              isGuest={isGuest}
              hasSubscriptionItems={hasSubscriptionItems}
              canConfirmContact={canConfirmContact}
              onContinue={() => setContactConfirmed(true)}
            />
          ) : (
            <DeliveryStep
              locale={locale}
              checkout={checkout}
              formData={formData}
              onEditContact={() => setContactConfirmed(false)}
              shippingOptions={shippingOptions}
              selectedShippingOptionId={selectedShippingOptionId}
              pakkeshopOption={pakkeshopOption}
              selectedPoint={selectedPoint}
              onOpenPickupSheet={() => setSheetOpen(true)}
              onContinue={() => handleStepChange(2)}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <ReviewStep
          locale={locale}
          checkout={checkout}
          formData={formData}
          selectedCarrier={selectedCarrier}
          selectedPoint={selectedPoint}
          onEditToStep={handleStepChange}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          hasSubscriptionItems={hasSubscriptionItems}
          termsAccepted={termsAccepted}
          onTermsChange={onTermsChange}
          subscriptionTermsAccepted={subscriptionTermsAccepted}
          onSubscriptionTermsChange={onSubscriptionTermsChange}
          onConfirm={() => handleStepChange(3)}
        />
      )}

      {step === 3 && (
        <PaymentStep
          checkout={checkout}
          paymentContent={paymentContent}
          paymentProcessing={paymentProcessing}
          onBackToReview={() => handleStepChange(2)}
        />
      )}

      <PickupPointSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        checkout={checkout}
        locale={locale}
        searchAddress={searchAddress}
        onSearchAddressChange={setSearchAddress}
        pickupLoading={pickupLoading}
        pickupPoints={pickupPoints}
        selectedPoint={selectedPoint}
        onSelectPoint={selectPoint}
        getOptionForCarrier={getOptionForCarrier}
      />
    </>
  );
}
