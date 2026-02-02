"use client";

import { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
}: CheckoutStepsProps) {
  const [step, setStep] = useState<CheckoutStepNum>(1);
  const { checkout } = dict;

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
            <RadioGroup defaultValue="home" className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 p-4 has-checked:border-primary has-checked:bg-primary/5">
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
              <div className="flex items-center justify-between rounded-lg border-2 border-border p-4 transition-colors hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5">
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
                <span className="ml-4 shrink-0 font-medium text-success">{checkout.freeLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border-2 border-border p-4 transition-colors hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/5">
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
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
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
              onClick={() => setStep(1)}
              className="rounded-full border-2 border-border px-8 py-4 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.previousStep}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
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
            <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="text-muted-foreground">
                {locale === "da"
                  ? "Adyen betalingsmodul integreres her"
                  : "Adyen payment module will be integrated here"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "da"
                  ? "Understøtter kort, MobilePay, Apple Pay, Google Pay"
                  : "Supports cards, MobilePay, Apple Pay, Google Pay"}
              </p>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border-2 border-border px-8 py-4 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.previousStep}
            </button>
            <Link
              href={confirmationHref}
              className="rounded-full bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {checkout.placeOrder}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
