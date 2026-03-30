"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RotateCw } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CheckoutFormData } from "./checkout-form.types";

interface ContactFormProps {
  formData: CheckoutFormData;
  onFormDataChange: (data: CheckoutFormData) => void;
  checkout: Dictionary["checkout"];
  isGuest: boolean;
  hasSubscriptionItems: boolean;
  canConfirmContact: boolean;
  onContinue: () => void;
}

export function ContactForm({
  formData,
  onFormDataChange,
  checkout,
  isGuest,
  hasSubscriptionItems,
  canConfirmContact,
  onContinue,
}: ContactFormProps) {
  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">{checkout.contact}</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">{checkout.email}</Label>
            <Input type="email" id="email" placeholder="you@example.com" className="w-full" value={formData.email} onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })} />
            {isGuest && !hasSubscriptionItems && (
              <p className="text-xs text-muted-foreground mt-1">{checkout.guestCheckoutNote}</p>
            )}
          </div>
          <label htmlFor="marketing" className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="marketing"
              checked={formData.marketingOptIn}
              onChange={(e) =>
                onFormDataChange({ ...formData, marketingOptIn: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">{checkout.marketingOptIn}</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">{checkout.shippingAddress}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-sm">{checkout.firstName}</Label>
            <Input id="firstName" className="w-full" value={formData.firstName} onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-sm">{checkout.lastName}</Label>
            <Input id="lastName" className="w-full" value={formData.lastName} onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address" className="text-sm">{checkout.address}</Label>
            <Input id="address" className="w-full" value={formData.address1} onChange={(e) => onFormDataChange({ ...formData, address1: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postalCode" className="text-sm">{checkout.postalCode}</Label>
            <Input id="postalCode" className="w-full" value={formData.postalCode} onChange={(e) => onFormDataChange({ ...formData, postalCode: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm">{checkout.city}</Label>
            <Input id="city" className="w-full" value={formData.city} onChange={(e) => onFormDataChange({ ...formData, city: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone" className="text-sm">{checkout.phone}</Label>
            <Input type="tel" id="phone" placeholder="+45" className="w-full" value={formData.phone} onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })} />
          </div>
        </div>
      </div>

      {hasSubscriptionItems && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <RotateCw className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">{checkout.subscriptionNote}</p>
        </div>
      )}

      <button type="button" onClick={onContinue} disabled={!canConfirmContact} className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {checkout.nextStep}
      </button>
    </>
  );
}
