"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { PickupPoint } from "@/lib/pickup-points";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import { formatOpeningHoursGrouped, type CarrierCode } from "./checkout-utils";

interface PickupPointSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkout: Dictionary["checkout"];
  locale: string;
  searchAddress: string;
  onSearchAddressChange: (value: string) => void;
  pickupLoading: boolean;
  pickupPoints: PickupPoint[];
  selectedPoint: PickupPoint | null;
  onSelectPoint: (point: PickupPoint) => void;
  getOptionForCarrier: (carrier: CarrierCode) => ShippingOption | undefined;
}

export function PickupPointSheet({
  open,
  onOpenChange,
  checkout,
  locale,
  searchAddress,
  onSearchAddressChange,
  pickupLoading,
  pickupPoints,
  selectedPoint,
  onSelectPoint,
  getOptionForCarrier,
}: PickupPointSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{checkout.selectPakkeshop}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{checkout.parcelShopSub}</p>
            <div className="space-y-2">
              <Label htmlFor="sheet-search-address" className="text-sm">{checkout.searchAddressPlaceholder}</Label>
              <Input
                id="sheet-search-address"
                placeholder={checkout.searchAddressPlaceholder}
                value={searchAddress}
                onChange={(e) => onSearchAddressChange(e.target.value)}
                className="w-full"
              />
              {pickupLoading && <p className="text-xs text-muted-foreground">{checkout.searching}</p>}
            </div>
            {pickupPoints.length > 0 && (
              <ul className="space-y-2">
                {pickupPoints.map((point) => {
                  const isSelected = selectedPoint?.id === point.id || selectedPoint?.number === point.number;
                  const carrier: CarrierCode =
                    point.carrier_code === "dao" ? "dao" : point.carrier_code === "pdk" ? "pdk" : "gls";
                  const dist = point.distance != null && Number.isFinite(point.distance) ? point.distance : null;
                  const distanceStr = dist != null
                    ? (dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)}`.replace(".", ",") + " km")
                    : null;
                  const hasOpeningHours = Array.isArray(point.opening_hours) && point.opening_hours.length > 0;
                  const groupedHours = hasOpeningHours ? formatOpeningHoursGrouped(point.opening_hours!) : [];
                  return (
                    <li key={`${point.carrier_code ?? carrier}-${point.id}`} className="space-y-0">
                      <div
                        className={cn(
                          "w-full rounded-lg border text-sm transition-colors overflow-hidden",
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectPoint(point)}
                          className={cn(
                            "w-full p-3 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors",
                            !isSelected && "rounded-lg"
                          )}
                        >
                          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", isSelected ? "border-primary bg-primary" : "border-border bg-background")} aria-hidden>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{point.name}</p>
                            <p className="text-muted-foreground mt-0.5 truncate">{point.address}, {point.zipcode} {point.city}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {distanceStr != null && (
                              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{distanceStr}</span>
                            )}
                            <div className="h-8 w-12 flex items-center justify-center rounded bg-muted/50">
                              {carrier === "pdk" ? (
                                <span className="text-[9px] font-semibold leading-tight text-center text-muted-foreground px-0.5">PostNord</span>
                              ) : (
                                <Image
                                  src={carrier === "dao" ? "/carriers/dao_logo_red_transparent_BG_RGB.svg" : "/carriers/GLS_Logo_2021_RGB_GLSBlue.png"}
                                  alt={carrier === "dao" ? "DAO" : "GLS"}
                                  width={48}
                                  height={20}
                                  className="h-5 w-auto object-contain"
                                />
                              )}
                            </div>
                          </div>
                        </button>
                        {isSelected && (
                          <div className="px-3 pb-3 pt-0 text-xs text-muted-foreground border-t border-border/50">
                            <div className="pl-8">
                              {groupedHours.length > 0 ? (
                                <Accordion className="w-full">
                                  <AccordionItem value="hours" className="border-none">
                                    <AccordionTrigger className="py-1 text-xs font-medium text-muted-foreground hover:no-underline justify-start gap-1.5 w-full **:data-[slot=accordion-trigger-icon]:text-muted-foreground **:data-[slot=accordion-trigger-icon]:ml-0 **:data-[slot=accordion-trigger-icon]:size-3.5">
                                      {checkout.openingHours}
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1">
                                      <ul className="space-y-0.5 text-muted-foreground">
                                        {groupedHours.map((line, i) => (
                                          <li key={i}>{line}</li>
                                        ))}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : null}
                              <div className="flex justify-end pt-2 mt-1">
                                <span className="text-sm font-medium text-foreground tabular-nums">
                                  {(() => {
                                    const c: CarrierCode = point.carrier_code === "pdk" ? "pdk" : point.carrier_code === "dao" ? "dao" : "gls";
                                    const opt = getOptionForCarrier(c);
                                    const amt = opt?.amount;
                                    return amt != null && amt > 0 ? formatPrice(amt, locale) : (locale === "da" ? "Beregnes" : "Calculated");
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetBody>
        {selectedPoint && (
          <SheetFooter>
            <div className="flex items-center gap-2 mb-3 rounded-md bg-primary/5 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-medium">{selectedPoint.name}</span>{" — "}{selectedPoint.zipcode} {selectedPoint.city}
              </p>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors">
              {checkout.confirmPakkeshop}
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
