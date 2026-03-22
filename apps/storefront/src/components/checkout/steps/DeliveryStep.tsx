"use client";

import { MapPin } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import type { PickupPoint } from "@/lib/pickup-points";
import { CollapsedSection } from "./CollapsedSection";
import type { CheckoutFormData } from "./checkout-form.types";

interface DeliveryStepProps {
  locale: string;
  checkout: Dictionary["checkout"];
  formData: CheckoutFormData;
  onEditContact: () => void;
  shippingOptions: ShippingOption[];
  selectedShippingOptionId: string | null;
  pakkeshopOption: ShippingOption | undefined;
  selectedPoint: PickupPoint | null;
  onOpenPickupSheet: () => void;
  onContinue: () => void;
}

export function DeliveryStep({
  locale,
  checkout,
  formData,
  onEditContact,
  shippingOptions,
  selectedShippingOptionId,
  pakkeshopOption,
  selectedPoint,
  onOpenPickupSheet,
  onContinue,
}: DeliveryStepProps) {
  return (
    <>
      <CollapsedSection title={checkout.yourInfo} editLabel={checkout.editInfo} onEdit={onEditContact}>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{formData.firstName} {formData.lastName}</p>
          <p className="text-muted-foreground">{formData.email}</p>
          {formData.address1 && <p className="text-muted-foreground">{formData.address1}, {formData.postalCode} {formData.city}</p>}
          {formData.phone && <p className="text-muted-foreground">{formData.phone}</p>}
        </div>
      </CollapsedSection>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">{checkout.deliveryMethod}</h2>
        <button
          type="button"
          onClick={onOpenPickupSheet}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border-2 p-3.5 text-left transition-colors",
            selectedPoint ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-muted/50">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{checkout.parcelShop}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{checkout.parcelShopSub}</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
            {selectedPoint
              ? (() => {
                  const opt = selectedShippingOptionId
                    ? shippingOptions.find((o) => o.id === selectedShippingOptionId)
                    : pakkeshopOption;
                  const amt = opt?.amount;
                  return amt != null && amt > 0
                    ? formatPrice(amt, locale)
                    : locale === "da"
                      ? "Beregnes"
                      : "Calculated";
                })()
              : locale === "da"
                ? "Beregnes"
                : "Calculated"}
          </span>
        </button>

        {selectedPoint ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-medium text-foreground">{selectedPoint.name}</p>
              <p className="text-muted-foreground">{selectedPoint.address}, {selectedPoint.zipcode} {selectedPoint.city}</p>
            </div>
            <button type="button" onClick={onOpenPickupSheet} className="shrink-0 text-xs font-medium text-primary hover:underline">{checkout.editInfo}</button>
          </div>
        ) : (
          <button type="button" onClick={onOpenPickupSheet} className="mt-4 w-full rounded-lg border-2 border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-center">
            <MapPin className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            {checkout.selectPakkeshop}
          </button>
        )}
      </div>

      <button type="button" onClick={onContinue} disabled={!selectedPoint} className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {checkout.nextStep}
      </button>
    </>
  );
}
