"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, RotateCw, MapPin, Pencil, Lock, CreditCard, Smartphone } from "lucide-react";
import { fetchAllPickupPoints, extractZipcodeFromAddress, enrichWithDistance, type PickupPoint } from "@/lib/pickup-points";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ShippingOption } from "./CheckoutWithStripe";
import type { Dictionary } from "@/i18n/dictionaries";

export type CheckoutStepNum = 1 | 2 | 3;

interface CheckoutStepsProps {
  locale: string;
  dict: Dictionary;
  confirmationHref: string;
  onStepChange?: (step: CheckoutStepNum) => void;
  paymentContent?: React.ReactNode;
  paymentReady?: boolean;
  paymentLoading?: boolean;
  paymentProcessing?: boolean;
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
  initialPickupZipcode?: string;
  initialPickupPointId?: string;
  termsAccepted?: boolean;
  onTermsChange?: (accepted: boolean) => void;
  subscriptionTermsAccepted?: boolean;
  onSubscriptionTermsChange?: (accepted: boolean) => void;
  hasSubscriptionItems?: boolean;
  /** When true, show "guest checkout" note (no account created). */
  isGuest?: boolean;
  onRegisterGoToStep?: (fn: (step: CheckoutStepNum) => void) => void;
}

type CarrierCode = "gls" | "dao" | "pdk";
type PaymentMethodChoice = "card" | "mobilepay" | "klarna";

const STEPS: { num: CheckoutStepNum; labelKey: "shipping" | "review" | "payment" }[] = [
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
  paymentLoading = false,
  paymentProcessing = false,
  shippingOptions = [],
  selectedShippingOptionId = null,
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
  initialPickupZipcode = "",
  initialPickupPointId = "",
  termsAccepted = false,
  onTermsChange,
  subscriptionTermsAccepted = false,
  onSubscriptionTermsChange,
  hasSubscriptionItems = false,
  isGuest = false,
  onRegisterGoToStep,
}: CheckoutStepsProps) {
  const [step, setStep] = useState<CheckoutStepNum>(1);
  const [contactConfirmed, setContactConfirmed] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode>("gls");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodChoice>("card");
  const [searchAddress, setSearchAddress] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pickupPrefillDoneRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDebounceRef = useRef(false);
  const { checkout } = dict;

  const pakkeshopOption = shippingOptions.find((o) =>
    o.name.toLowerCase().includes("pakkeshop") || o.name.toLowerCase().includes("gls")
  ) ?? shippingOptions[0];

  function getOptionForCarrier(carrier: CarrierCode) {
    if (carrier === "pdk") return shippingOptions.find((o) => o.name.toLowerCase().includes("postnord"));
    if (carrier === "dao") return shippingOptions.find((o) => o.name.toLowerCase().includes("dao"));
    return shippingOptions.find((o) => o.name.toLowerCase().includes("gls"));
  }

  useEffect(() => {
    if (!onShippingSelect || !shippingOptions.length) return;
    const carrier: CarrierCode = selectedPoint?.carrier_code === "pdk" ? "pdk" : selectedPoint?.carrier_code === "dao" ? "dao" : "gls";
    const option = selectedPoint ? getOptionForCarrier(carrier) ?? pakkeshopOption : pakkeshopOption;
    if (option) {
      onShippingSelect(option.id, selectedPoint ? {
        service_point_id: selectedPoint.number ?? selectedPoint.id,
        service_point_name: selectedPoint.name,
        service_point_address: selectedPoint.address,
        service_point_zipcode: selectedPoint.zipcode,
        service_point_city: selectedPoint.city,
        carrier_code: selectedPoint.carrier_code ?? "gls",
      } : {});
    }
  }, [pakkeshopOption, selectedPoint, onShippingSelect, shippingOptions]);

  const searchPickupPoints = useCallback(async (addressOverride?: string) => {
    const raw = (addressOverride ?? searchAddress).trim();
    const zip = extractZipcodeFromAddress(raw) || raw.slice(0, 4);
    if (!zip || zip.length < 3) return;
    setPickupLoading(true);
    setPickupPoints([]);
    try {
      const points = await fetchAllPickupPoints({
        zipcode: zip,
        country_code: "DK",
        address: raw.length > 4 ? raw : undefined,
      });
      const enriched = await enrichWithDistance(points, raw);
      setPickupPoints(enriched);
      setSelectedPoint(null);
    } finally {
      setPickupLoading(false);
    }
  }, [searchAddress]);

  const selectPoint = useCallback((point: PickupPoint) => {
    setSelectedPoint(point);
    setSelectedCarrier(
      point.carrier_code === "dao" ? "dao" : point.carrier_code === "pdk" ? "pdk" : "gls"
    );
  }, []);

  useEffect(() => {
    if (pickupPrefillDoneRef.current || !initialPickupZipcode) return;
    pickupPrefillDoneRef.current = true;
    setSearchAddress(initialPickupZipcode);
    setPickupLoading(true);
    fetchAllPickupPoints({ zipcode: initialPickupZipcode, country_code: "DK" })
      .then((points) => enrichWithDistance(points, initialPickupZipcode))
      .then((points) => {
        setPickupPoints(points);
        if (initialPickupPointId) {
          const match = points.find((p) => p.number === initialPickupPointId || p.id === initialPickupPointId);
          if (match) {
            setSelectedPoint(match);
            setSelectedCarrier(
              match.carrier_code === "dao" ? "dao" : match.carrier_code === "pdk" ? "pdk" : "gls"
            );
          }
        }
      })
      .finally(() => setPickupLoading(false));
  }, [initialPickupZipcode, initialPickupPointId]);

  // When sheet opens, pre-fill search from "Dine oplysninger" and run initial search (does not rely on onOpenChange which may not fire when opening via button)
  useEffect(() => {
    if (!sheetOpen) return;
    const addr = (formData.address1 ?? "").trim();
    const zip = (formData.postalCode ?? "").trim().replace(/\D/g, "").slice(0, 4);
    const city = (formData.city ?? "").trim();
    const hasAddress = addr.length > 0 || (zip.length >= 3 && city.length > 0);
    if (!hasAddress) return;
    const combined = addr
      ? `${addr}${zip ? `, ${zip}` : ""}${city ? ` ${city}` : ""}`.trim()
      : `${zip}${city ? ` ${city}` : ""}`.trim();
    if (!combined || searchAddress.trim() === combined) return;
    skipNextDebounceRef.current = true;
    setSearchAddress(combined);
    setPickupLoading(true);
    setPickupPoints([]);
    const zipForSearch = zip.length >= 3 ? zip : extractZipcodeFromAddress(combined) || combined.slice(0, 4);
    if (zipForSearch.length >= 3) {
      fetchAllPickupPoints({
        zipcode: zipForSearch,
        country_code: "DK",
        address: combined.length > 4 ? combined : undefined,
      })
        .then((points) => enrichWithDistance(points, combined || zipForSearch))
        .then((points) => {
          setPickupPoints(points);
          setSelectedPoint(null);
        })
        .finally(() => setPickupLoading(false));
    } else {
      setPickupLoading(false);
    }
  }, [sheetOpen]);

  // Debounced search when user types in address field (skip when address was just set from form on sheet open)
  useEffect(() => {
    if (!sheetOpen) return;
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const zip = extractZipcodeFromAddress(searchAddress) || searchAddress.trim().replace(/\D/g, "").slice(0, 4);
    if (zip.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setPickupLoading(true);
      setPickupPoints([]);
      const addr = searchAddress.trim();
      fetchAllPickupPoints({
        zipcode: zip,
        country_code: "DK",
        address: addr.length > 4 ? addr : undefined,
      })
        .then((points) => enrichWithDistance(points, addr || zip))
        .then((points) => {
          setPickupPoints(points);
          setSelectedPoint(null);
        })
        .finally(() => setPickupLoading(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [sheetOpen, searchAddress]);

  const handleStepChange = useCallback((newStep: CheckoutStepNum) => {
    setStep(newStep);
    onStepChange?.(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [onStepChange]);

  useEffect(() => {
    onRegisterGoToStep?.(handleStepChange);
  }, [onRegisterGoToStep, handleStepChange]);


  const canConfirmContact =
    formData.email.trim() &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.address1.trim() &&
    formData.postalCode.trim() &&
    formData.city.trim();

  const paymentMethods: { id: PaymentMethodChoice; label: string; sub: string; icon: React.ReactNode; disabled?: boolean }[] = [
    {
      id: "card",
      label: locale === "da" ? "Kortbetaling" : "Card payment",
      sub: "Visa, Mastercard",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: "mobilepay",
      label: "MobilePay",
      sub: locale === "da" ? "Betal med MobilePay" : "Pay with MobilePay",
      icon: <Smartphone className="h-5 w-5" />,
      disabled: hasSubscriptionItems,
    },
    {
      id: "klarna",
      label: "Klarna",
      sub: locale === "da" ? "Køb nu, betal senere" : "Buy now, pay later",
      icon: <span className="text-sm font-bold leading-none">K.</span>,
      disabled: hasSubscriptionItems,
    },
  ];

  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-6">
        {STEPS.map((s, idx) => {
          const visualStep = paymentProcessing ? 3 : step;
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

      {/* ═══════════════════════════════════════════
          STEP 1 — Levering (kontakt + leveringsmetode)
          ═══════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-5">
          {!contactConfirmed ? (
            <>
              <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">{checkout.contact}</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">{checkout.email}</Label>
                    <Input type="email" id="email" placeholder="you@example.com" className="w-full" value={formData.email} onChange={(e) => onFormDataChange?.({ ...formData, email: e.target.value })} />
                    {isGuest && !hasSubscriptionItems && (
                      <p className="text-xs text-muted-foreground mt-1">{checkout.guestCheckoutNote}</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="marketing" className="h-4 w-4 rounded border-border accent-primary" />
                    <span className="text-sm text-muted-foreground">{checkout.marketingOptIn}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">{checkout.shippingAddress}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm">{checkout.firstName}</Label>
                    <Input id="firstName" className="w-full" value={formData.firstName} onChange={(e) => onFormDataChange?.({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm">{checkout.lastName}</Label>
                    <Input id="lastName" className="w-full" value={formData.lastName} onChange={(e) => onFormDataChange?.({ ...formData, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address" className="text-sm">{checkout.address}</Label>
                    <Input id="address" className="w-full" value={formData.address1} onChange={(e) => onFormDataChange?.({ ...formData, address1: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-sm">{checkout.postalCode}</Label>
                    <Input id="postalCode" className="w-full" value={formData.postalCode} onChange={(e) => onFormDataChange?.({ ...formData, postalCode: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-sm">{checkout.city}</Label>
                    <Input id="city" className="w-full" value={formData.city} onChange={(e) => onFormDataChange?.({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone" className="text-sm">{checkout.phone}</Label>
                    <Input type="tel" id="phone" placeholder="+45" className="w-full" value={formData.phone} onChange={(e) => onFormDataChange?.({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {hasSubscriptionItems && (
                <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <RotateCw className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{checkout.subscriptionNote}</p>
                </div>
              )}

              <button type="button" onClick={() => setContactConfirmed(true)} disabled={!canConfirmContact} className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {checkout.nextStep}
              </button>
            </>
          ) : (
            <>
              <CollapsedSection title={checkout.yourInfo} editLabel={checkout.editInfo} onEdit={() => setContactConfirmed(false)}>
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
                  onClick={() => setSheetOpen(true)}
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
                            ? `${(amt / 100).toFixed(0)} DKK`
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
                    <button type="button" onClick={() => setSheetOpen(true)} className="shrink-0 text-xs font-medium text-primary hover:underline">{checkout.editInfo}</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setSheetOpen(true)} className="mt-4 w-full rounded-lg border-2 border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-center">
                    <MapPin className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                    {checkout.selectPakkeshop}
                  </button>
                )}
              </div>

              <button type="button" onClick={() => handleStepChange(2)} disabled={!selectedPoint} className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {checkout.nextStep}
              </button>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STEP 2 — Oversigt (summaries + valg af
          betalingsmetode + betingelser + bekræft)
          ═══════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-5">
          <CollapsedSection title={checkout.yourInfo} editLabel={checkout.editInfo} onEdit={() => handleStepChange(1)}>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{formData.firstName} {formData.lastName}</p>
              <p className="text-muted-foreground">{formData.email}</p>
              {formData.address1 && <p className="text-muted-foreground">{formData.address1}, {formData.postalCode} {formData.city}</p>}
              {formData.phone && <p className="text-muted-foreground">{formData.phone}</p>}
            </div>
          </CollapsedSection>

          <CollapsedSection title={checkout.deliveryMethod} editLabel={checkout.editInfo} onEdit={() => handleStepChange(1)}>
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
                {selectedPoint && <p className="text-muted-foreground mt-0.5">{selectedPoint.name}, {selectedPoint.address}, {selectedPoint.zipcode} {selectedPoint.city}</p>}
              </div>
            </div>
          </CollapsedSection>

          {/* Payment method SELECTION (visual radio cards) */}
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
                  onClick={() => !pm.disabled && setSelectedPaymentMethod(pm.id)}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-lg border-2 p-3.5 text-left transition-colors",
                    pm.disabled
                      ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                      : selectedPaymentMethod === pm.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                  )}
                >
                  <span className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    selectedPaymentMethod === pm.id && !pm.disabled ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"
                  )}>
                    {pm.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{pm.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pm.sub}</p>
                  </div>
                  {/* Radio indicator */}
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selectedPaymentMethod === pm.id && !pm.disabled
                      ? "border-primary"
                      : "border-border"
                  )}>
                    {selectedPaymentMethod === pm.id && !pm.disabled && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                </button>
              ))}
              {hasSubscriptionItems && (
                <p className="text-xs text-muted-foreground mt-2">
                  <RotateCw className="inline h-3 w-3 mr-1 text-primary" />
                  {locale === "da"
                    ? "MobilePay og Klarna er ikke tilgængelige for abonnementsordrer."
                    : "MobilePay and Klarna are not available for subscription orders."}
                </p>
              )}
            </div>
          </div>

          {/* Accept terms */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">{checkout.acceptTerms}</h2>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => onTermsChange?.(e.target.checked)} className="sr-only peer" />
              <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-[4px] border-[1.5px] border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1 shrink-0">
                {termsAccepted && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6.5L4.5 9L10 3" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {locale === "da" ? (
                  <>
                    Jeg accepterer{" "}
                    <Link href={`/${locale}/policies/terms`} className="font-medium text-primary hover:underline" target="_blank">{checkout.termsLink}</Link>
                    . Jeg accepterer, at min bestilling først er bindende for butikken, når vi bekræftiger og en ordrebekræftelse er sendt. Jeg godkender, at betalte og uafhentede pakker returneres afsender. Jeg er informeret om, at Guapo behandler mine personoplysninger iht.{" "}
                    <Link href={`/${locale}/policies/privacy`} className="font-medium text-primary hover:underline" target="_blank">{checkout.privacyLink}</Link>
                    {" "}for kunder.
                  </>
                ) : (
                  <>
                    I accept the{" "}
                    <Link href={`/${locale}/policies/terms`} className="font-medium text-primary hover:underline" target="_blank">{checkout.termsLink}</Link>
                    . I accept that my order is only binding once confirmed via an order confirmation email. I accept that paid and uncollected packages are returned to sender. I am informed that Guapo processes my personal data according to the{" "}
                    <Link href={`/${locale}/policies/privacy`} className="font-medium text-primary hover:underline" target="_blank">{checkout.privacyLink}</Link>
                    {" "}for customers.
                  </>
                )}
              </span>
            </label>

            {hasSubscriptionItems && (
              <>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide pt-1">{checkout.acceptSubscriptionTerms}</h3>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={subscriptionTermsAccepted} onChange={(e) => onSubscriptionTermsChange?.(e.target.checked)} className="sr-only peer" />
                  <span className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-[4px] border-[1.5px] border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1 shrink-0">
                    {subscriptionTermsAccepted && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6.5L4.5 9L10 3" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {checkout.subscriptionTermsText}{" "}
                    <Link href={`/${locale}/policies/terms`} className="font-medium text-primary hover:underline" target="_blank">{checkout.subscriptionTermsLink}</Link>.
                  </span>
                </label>
              </>
            )}
          </div>

          {/* Navigation */}
          <div>
            <button
              type="button"
              onClick={() => handleStepChange(3)}
              disabled={!termsAccepted || (hasSubscriptionItems && !subscriptionTermsAccepted)}
              className="w-full rounded-lg bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkout.confirmOrder}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STEP 3 — Betaling (betalingsform)
          The actual Stripe PaymentElement + Betal nu
          ═══════════════════════════════════════════ */}
      {step === 3 && (
        <div className={cn("space-y-5", paymentProcessing && "invisible h-0 overflow-hidden")}>
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-1">
              {checkout.paymentMethod}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {locale === "da"
                ? "Udfyld dine betalingsoplysninger nedenfor."
                : "Enter your payment details below."}
            </p>
            <div>{paymentContent}</div>
          </div>

          <button type="button" onClick={() => handleStepChange(2)} className="rounded-lg border border-border bg-background px-6 py-3.5 text-sm font-medium text-foreground hover:bg-surface hover:border-primary/40 transition-colors">
            {checkout.previousStep}
          </button>
        </div>
      )}

      {/* Processing overlay (covers Step 3 while Stripe confirms) */}
      {paymentProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/98">
          <div className="flex flex-col items-center gap-5 text-center px-6">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
              <Lock className="absolute inset-0 m-auto h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {locale === "da" ? "Behandler din betaling" : "Processing your payment"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                {locale === "da"
                  ? "Vent venligst mens vi behandler din ordre. Luk ikke vinduet."
                  : "Please wait while we process your order. Do not close this window."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───── Pakkeshop Sheet ───── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                  onChange={(e) => setSearchAddress(e.target.value)}
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
                            onClick={() => selectPoint(point)}
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
                                      const carrier: CarrierCode = point.carrier_code === "pdk" ? "pdk" : point.carrier_code === "dao" ? "dao" : "gls";
                                      const opt = getOptionForCarrier(carrier);
                                      const amt = opt?.amount;
                                      return amt != null && amt > 0 ? `${(amt / 100).toFixed(0)} DKK` : (locale === "da" ? "Beregnes" : "Calculated");
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
              <button type="button" onClick={() => setSheetOpen(false)} className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors">
                {checkout.confirmPakkeshop}
              </button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Danish day names (short for ranges). Order: Mon=0 .. Sun=6. */
const DAY_NAMES_DA: Record<number, string> = {
  0: "Mandag",
  1: "Tirsdag",
  2: "Onsdag",
  3: "Torsdag",
  4: "Fredag",
  5: "Lørdag",
  6: "Søndag",
};
const DAY_SHORT_DA: Record<number, string> = {
  0: "Man",
  1: "Tir",
  2: "Ons",
  3: "Tor",
  4: "Fre",
  5: "Lør",
  6: "Søn",
};
const EN_DAY_TO_INDEX: Record<string, number> = {
  monday: 0, mon: 0, tuesday: 1, tue: 1, wednesday: 2, wed: 2,
  thursday: 3, thu: 3, thurs: 3, friday: 4, fri: 4, saturday: 5, sat: 5, sunday: 6, sun: 6,
};

/**
 * Parse opening_hours lines (e.g. "Monday: 06:00-22:00"), translate to Danish,
 * group consecutive days with identical hours, return e.g. ["Man-fre: 06.00-22.00", "Lør-søn: 07.00-22.00"].
 */
function formatOpeningHoursGrouped(hours: string[]): string[] {
  if (!Array.isArray(hours) || hours.length === 0) return [];
  const parsed: { day: number; time: string }[] = [];
  for (const line of hours) {
    const trimmed = (line || "").trim();
    const match = trimmed.match(/^(\w+)\s*[:\-]\s*(.+)$/i);
    if (!match) continue;
    const dayKey = match[1].toLowerCase();
    const dayIndex = EN_DAY_TO_INDEX[dayKey];
    if (dayIndex === undefined) continue;
    let time = match[2].trim().replace(/\s/g, "");
    time = time.replace(/:/g, "."); // Danish style 06.00-22.00
    parsed.push({ day: dayIndex, time });
  }
  parsed.sort((a, b) => a.day - b.day);
  const groups: { start: number; end: number; time: string }[] = [];
  for (const { day, time } of parsed) {
    const last = groups[groups.length - 1];
    if (last && last.end === day - 1 && last.time === time) {
      last.end = day;
    } else {
      groups.push({ start: day, end: day, time });
    }
  }
  return groups.map((g) => {
    const startLabel = g.start === g.end ? DAY_NAMES_DA[g.start] : `${DAY_SHORT_DA[g.start]}-${DAY_SHORT_DA[g.end]}`;
    return `${startLabel}: ${g.time}`;
  });
}

function CollapsedSection({ title, editLabel, onEdit, children }: { title: string; editLabel: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" />
          {title}
        </h2>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Pencil className="h-3 w-3" />
          {editLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
