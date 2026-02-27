"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  selectedShippingOptionId,
  onShippingSelect,
}: CheckoutStepsProps) {
  const [step, setStep] = useState<CheckoutStepNum>(1);
  const [deliveryType, setDeliveryType] = useState<"home" | "parcel" | "express">("home");
  const [parcelZipcode, setParcelZipcode] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const { checkout } = dict;

  const standardOption = shippingOptions.find((o) => o.amount === 0 || o.name.includes("Standard")) ?? shippingOptions[0];
  const pakkeshopOption = shippingOptions.find((o) => o.name.includes("Pakkeshop") || o.name.includes("39"));

  const searchPickupPoints = useCallback(async () => {
    if (!parcelZipcode.trim() || parcelZipcode.length < 3) return;
    setPickupLoading(true);
    setPickupPoints([]);
    try {
      const points = await fetchPickupPoints({ zipcode: parcelZipcode.trim(), country_code: "DK", carrier_code: "gls" });
      setPickupPoints(points);
      if (points.length && !selectedPoint) setSelectedPoint(null);
    } finally {
      setPickupLoading(false);
    }
  }, [parcelZipcode]);

  const selectPoint = useCallback(
    (point: PickupPoint) => {
      setSelectedPoint(point);
      if (pakkeshopOption && onShippingSelect) {
        onShippingSelect(pakkeshopOption.id, {
          service_point_id: point.number ?? point.id,
          service_point_name: point.name,
          service_point_address: point.address,
          service_point_zipcode: point.zipcode,
          service_point_city: point.city,
        });
      }
    },
    [pakkeshopOption, onShippingSelect]
  );

  const selectHome = useCallback(() => {
    setDeliveryType("home");
    setSelectedPoint(null);
    if (standardOption && onShippingSelect) onShippingSelect(standardOption.id, {});
  }, [standardOption, onShippingSelect]);

  const selectParcel = useCallback(() => {
    setDeliveryType("parcel");
    if (pakkeshopOption && selectedPoint && onShippingSelect) {
      onShippingSelect(pakkeshopOption.id, {
        service_point_id: selectedPoint.number ?? selectedPoint.id,
        service_point_name: selectedPoint.name,
        service_point_address: selectedPoint.address,
        service_point_zipcode: selectedPoint.zipcode,
        service_point_city: selectedPoint.city,
      });
    } else if (pakkeshopOption && onShippingSelect) {
      onShippingSelect(pakkeshopOption.id, {});
    }
  }, [pakkeshopOption, selectedPoint, onShippingSelect]);

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
                <Input id="firstName" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{locale === "da" ? "Efternavn" : "Last name"}</Label>
                <Input id="lastName" className="w-full" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">{locale === "da" ? "Adresse" : "Address"}</Label>
                <Input id="address" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{locale === "da" ? "Postnummer" : "Postal code"}</Label>
                <Input id="postalCode" className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{locale === "da" ? "By" : "City"}</Label>
                <Input id="city" className="w-full" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">{locale === "da" ? "Telefon" : "Phone"}</Label>
                <Input type="tel" id="phone" placeholder="+45" className="w-full" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{checkout.deliveryMethod}</h2>
            <RadioGroup
              value={deliveryType}
              onValueChange={(v) => {
                const next = v as "home" | "parcel" | "express";
                setDeliveryType(next);
                if (next === "home") selectHome();
                if (next === "parcel") selectParcel();
              }}
              className="mt-4 space-y-3"
            >
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border-2 p-4 transition-colors",
                  deliveryType === "home" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem
                  value="home"
                  id="delivery-home"
                  className="flex flex-1 items-center gap-3 rounded-lg border-0 p-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{checkout.homeDelivery}</p>
                    <p className="text-sm text-muted-foreground">{checkout.homeDeliverySub}</p>
                  </div>
                </RadioGroupItem>
                <span className="ml-4 shrink-0 font-medium text-success">{checkout.freeLabel}</span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border-2 p-4 transition-colors",
                  deliveryType === "parcel" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem
                  value="parcel"
                  id="delivery-parcel"
                  className="flex flex-1 items-center gap-3 rounded-lg border-0 p-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{checkout.parcelShop}</p>
                    <p className="text-sm text-muted-foreground">{checkout.parcelShopSub}</p>
                  </div>
                </RadioGroupItem>
                <span className="ml-4 shrink-0 font-medium text-foreground">
                  {pakkeshopOption?.amount != null && pakkeshopOption.amount > 0
                    ? `${(pakkeshopOption.amount / 100).toFixed(0)} DKK`
                    : "39 DKK"}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border-2 border-border p-4 transition-colors hover:border-primary/50"
                )}
              >
                <RadioGroupItem
                  value="express"
                  id="delivery-express"
                  className="flex flex-1 items-center gap-3 rounded-lg border-0 p-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{checkout.expressDelivery}</p>
                    <p className="text-sm text-muted-foreground">{checkout.expressDeliverySub}</p>
                  </div>
                </RadioGroupItem>
                <span className="ml-4 shrink-0 font-medium text-foreground">49 DKK</span>
              </div>
            </RadioGroup>

            {deliveryType === "parcel" && (
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
            )}
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
