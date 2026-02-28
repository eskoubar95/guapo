"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { fetchPickupPoints, type PickupPoint } from "@/lib/pickup-points";
import type { ShippingOption } from "./CheckoutWithStripe";

export type CheckoutStepNum = 1 | 2 | 3;

interface CheckoutStepsProps {
  locale: string;
  dict: {
    checkout: {
      contact: string;
      shipping: string;
      payment: string;
      review: string;
      placeOrder: string;
      deliveryMethod: string;
      homeDelivery: string;
      homeDeliverySub: string;
      parcelShop: string;
      parcelShopSub: string;
      expressDelivery: string;
      expressDeliverySub: string;
      freeLabel: string;
      continueToPayment: string;
      nextStep: string;
      previousStep: string;
    };
  };
  confirmationHref: string;
  onStepChange?: (step: CheckoutStepNum) => void;
  paymentContent?: React.ReactNode;
  paymentReady?: boolean;
  shippingOptions?: ShippingOption[];
  selectedShippingOptionId?: string | null;
  onShippingSelect?: (optionId: string, data: Record<string, unknown>) => void;
  formData?: {
    email: string;
    firstName: string;
    lastName: string;
    address1: string;
    postalCode: string;
    city: string;
    phone: string;
  };
  onFormDataChange?: (data: {
    email: string;
    firstName: string;
    lastName: string;
    address1: string;
    postalCode: string;
    city: string;
    phone: string;
  }) => void;
}

const STEPS: { num: CheckoutStepNum; labelKey: keyof CheckoutStepsProps["dict"]["checkout"] }[] = [
  { num: 1, labelKey: "shipping" },
  { num: 2, labelKey: "review" },
  { num: 3, labelKey: "payment" },
];

export function CheckoutSteps({
  locale,
  dict,
  confirmationHref,
  onStepChange,
  paymentContent,
  paymentReady,
  shippingOptions = [],
  onShippingSelect,
  formData = {
    email: "",
    firstName: "",
    lastName: "",
    address1: "",
    postalCode: "",
    city: "",
    phone: "",
  },
  onFormDataChange,
}: CheckoutStepsProps) {
  const [step, setStep] = useState<CheckoutStepNum>(1);
  const [parcelZipcode, setParcelZipcode] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const { checkout } = dict;

  const pakkeshopOption = shippingOptions.find((o) => o.name.includes("Pakkeshop") || o.name.includes("39")) ?? shippingOptions[0];

  useEffect(() => {
    if (pakkeshopOption && onShippingSelect) {
      onShippingSelect(pakkeshopOption.id, selectedPoint ? {
        service_point_id: selectedPoint.number ?? selectedPoint.id,
        service_point_name: selectedPoint.name,
        service_point_address: selectedPoint.address,
        service_point_zipcode: selectedPoint.zipcode,
        service_point_city: selectedPoint.city,
      } : {});
    }
  }, [pakkeshopOption, selectedPoint, onShippingSelect]);

  const searchPickupPoints = useCallback(async () => {
    if (!parcelZipcode.trim() || parcelZipcode.length < 3) return;
    setPickupLoading(true);
    setPickupPoints([]);
    try {
      const points = await fetchPickupPoints({ zipcode: parcelZipcode.trim(), country_code: "DK", carrier_code: "gls" });
      setPickupPoints(points);
      setSelectedPoint(null);
    } finally {
      setPickupLoading(false);
    }
  }, [parcelZipcode]);

  const selectPoint = useCallback((point: PickupPoint) => {
    setSelectedPoint(point);
  }, []);

  const handleStepChange = (newStep: CheckoutStepNum) => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  return (
    <>
      {/* Step indicator: 1. Levering, 2. Oversigt, 3. Betaling */}
      <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  step > s.num
                    ? "border-primary bg-primary text-primary-foreground"
                    : step === s.num
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground"
                )}
              >
                {step > s.num ? <Check className="h-5 w-5" /> : s.num}
              </div>
              <span
                className={cn(
                  "text-xs font-medium sm:block",
                  step >= s.num ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {checkout[s.labelKey]}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 sm:w-20",
                  step > s.num ? "bg-primary" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Levering – contact, address, delivery method */}
      {step === 1 && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground">{checkout.contact}</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="w-full"
                  value={formData.email}
                  onChange={(e) => onFormDataChange?.({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="marketing"
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Label htmlFor="marketing" className="font-normal text-muted-foreground">
                  {locale === "da"
                    ? "Modtag nyheder og tilbud på email"
                    : "Receive news and offers by email"}
                </Label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {locale === "da" ? "Leveringsadresse" : "Shipping Address"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{locale === "da" ? "Fornavn" : "First name"}</Label>
                <Input
                  id="firstName"
                  className="w-full"
                  value={formData.firstName}
                  onChange={(e) => onFormDataChange?.({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{locale === "da" ? "Efternavn" : "Last name"}</Label>
                <Input
                  id="lastName"
                  className="w-full"
                  value={formData.lastName}
                  onChange={(e) => onFormDataChange?.({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">{locale === "da" ? "Adresse" : "Address"}</Label>
                <Input
                  id="address"
                  className="w-full"
                  value={formData.address1}
                  onChange={(e) => onFormDataChange?.({ ...formData, address1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{locale === "da" ? "Postnummer" : "Postal code"}</Label>
                <Input
                  id="postalCode"
                  className="w-full"
                  value={formData.postalCode}
                  onChange={(e) => onFormDataChange?.({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{locale === "da" ? "By" : "City"}</Label>
                <Input
                  id="city"
                  className="w-full"
                  value={formData.city}
                  onChange={(e) => onFormDataChange?.({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">{locale === "da" ? "Telefon" : "Phone"}</Label>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="+45"
                  className="w-full"
                  value={formData.phone}
                  onChange={(e) => onFormDataChange?.({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{checkout.deliveryMethod}</h2>
            <div
              className={cn(
                "mt-4 flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 p-4"
              )}
            >
              <div>
                <p className="font-medium text-foreground">{checkout.parcelShop}</p>
                <p className="text-sm text-muted-foreground">{checkout.parcelShopSub}</p>
              </div>
              <span className="ml-4 shrink-0 font-medium text-foreground">
                {pakkeshopOption?.amount != null && pakkeshopOption.amount > 0
                  ? `${(pakkeshopOption.amount / 100).toFixed(0)} DKK`
                  : "39 DKK"}
              </span>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <Label htmlFor="parcel-zipcode">
                  {locale === "da" ? "Postnummer" : "Postal code"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="parcel-zipcode"
                    placeholder="1000"
                    value={parcelZipcode}
                    onChange={(e) => setParcelZipcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPickupPoints())}
                    className="max-w-[120px]"
                  />
                  <button
                    type="button"
                    onClick={searchPickupPoints}
                    disabled={pickupLoading || parcelZipcode.trim().length < 3}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {pickupLoading ? (locale === "da" ? "Søger..." : "Searching...") : locale === "da" ? "Søg" : "Search"}
                  </button>
                </div>
                {pickupPoints.length > 0 && (
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {pickupPoints.map((point) => (
                      <li key={point.id}>
                        <button
                          type="button"
                          onClick={() => selectPoint(point)}
                          className={cn(
                            "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                            selectedPoint?.id === point.id || selectedPoint?.number === point.number
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <p className="font-medium text-foreground">{point.name}</p>
                          <p className="text-muted-foreground">
                            {point.address}, {point.zipcode} {point.city}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedPoint && (
                  <p className="text-sm text-muted-foreground">
                    {locale === "da" ? "Valgt: " : "Selected: "}
                    {selectedPoint.name}, {selectedPoint.zipcode} {selectedPoint.city}
                  </p>
                )}
              </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleStepChange(2)}
              className="rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.nextStep}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Oversigt – review + order summary */}
      {step === 2 && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground">{checkout.review}</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              {locale === "da"
                ? "Tjek dine kontakt- og leveringsoplysninger i sidste øjeblik. Ordreoversigten vises til højre."
                : "Review your contact and delivery details. Order summary is shown on the right."}
            </p>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleStepChange(1)}
              className="rounded-full border-2 border-border px-8 py-4 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.previousStep}
            </button>
            <button
              type="button"
              onClick={() => handleStepChange(3)}
              className="rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.continueToPayment}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Betaling */}
      {step === 3 && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground">{checkout.payment}</h2>
            <div className="mt-4">
              {paymentContent ?? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="text-muted-foreground">
                    {locale === "da"
                      ? "Stripe betalingsmodul integreres her"
                      : "Stripe payment module will be integrated here"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {locale === "da"
                      ? "Understøtter kort, MobilePay, Apple Pay, Google Pay"
                      : "Supports cards, MobilePay, Apple Pay, Google Pay"}
                  </p>
                </div>
              )}
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleStepChange(2)}
              className="rounded-full border-2 border-border px-8 py-4 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.previousStep}
            </button>
            {(!paymentContent || paymentReady) && (
              <Link
                href={confirmationHref}
                className="rounded-full bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {checkout.placeOrder}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
