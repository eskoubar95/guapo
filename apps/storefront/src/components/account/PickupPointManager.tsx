"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { formatPickupCarrierLabel, type PickupPoint } from "@/lib/pickup-points";
import { Check, MapPin } from "lucide-react";
import { PickupPointSheet } from "@/components/checkout/steps/PickupPointSheet";
import type { Dictionary } from "@/i18n/dictionaries";
import { useAccountPickupSheetSearch } from "./hooks/useAccountPickupSheetSearch";

export interface PickupPointManagerLabels {
  preferredPickupPoint: string;
  noPickupPointSaved: string;
  postalCode: string;
  searchPickupPoint: string;
  pickupPointSaved: string;
  pickupPointError: string;
  saving: string;
  save: string;
  change: string;
  searchLoading: string;
  searchAction: string;
  cancel: string;
}

interface SavedPickupPoint {
  id: string;
  name: string;
  address: string;
  zipcode: string;
  city: string;
  carrier_code?: string;
}

interface PickupPointManagerProps {
  labels: PickupPointManagerLabels;
  checkout: Dictionary["checkout"];
  locale: string;
  /**
   * Billing/delivery address string (street, zip, city) — seeds pickup sheet search when it opens.
   * Built in AddressManager to mirror checkout delivery search.
   */
  addressSearchSeed: string;
}

export function PickupPointManager({
  labels,
  checkout,
  locale,
  addressSearchSeed,
}: PickupPointManagerProps) {
  const { customer, refetch } = useAuth();
  const [savedPickup, setSavedPickup] = useState<SavedPickupPoint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [savingPickup, setSavingPickup] = useState(false);
  const [pickupFeedback, setPickupFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );
  const didPreselectForOpenRef = useRef(false);

  useEffect(() => {
    if (!customer) return;
    const meta = customer.metadata as Record<string, unknown> | undefined;
    const pp = meta?.preferred_pickup_point as SavedPickupPoint | undefined;
    if (pp?.id) setSavedPickup(pp);
    else setSavedPickup(null);
  }, [customer]);

  const seedSearchOnOpen = useMemo(() => {
    const billing = addressSearchSeed.trim();
    if (billing.length >= 3) return billing;
    if (savedPickup) {
      const line = [savedPickup.address, `${savedPickup.zipcode ?? ""} ${savedPickup.city ?? ""}`.trim()]
        .filter(Boolean)
        .join(", ")
        .trim();
      if (line.length >= 3) return line;
      const z = savedPickup.zipcode?.trim().replace(/\D/g, "").slice(0, 4) ?? "";
      if (z.length >= 3) return z;
    }
    return "";
  }, [addressSearchSeed, savedPickup]);

  useAccountPickupSheetSearch({
    sheetOpen,
    searchAddress,
    setSearchAddress,
    seedSearchOnOpen,
    setPickupLoading,
    setPickupPoints,
    setSelectedPoint,
  });

  useEffect(() => {
    if (!sheetOpen) {
      didPreselectForOpenRef.current = false;
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen || didPreselectForOpenRef.current || !savedPickup || pickupPoints.length === 0) return;
    const match = pickupPoints.find((p) => {
      const pid = String(p.number ?? p.id);
      if (pid !== String(savedPickup.id)) return false;
      if (savedPickup.carrier_code && p.carrier_code) {
        return p.carrier_code === savedPickup.carrier_code;
      }
      return true;
    });
    if (match) {
      setSelectedPoint(match);
      didPreselectForOpenRef.current = true;
    }
  }, [sheetOpen, savedPickup, pickupPoints]);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSearchAddress("");
      setPickupPoints([]);
      setSelectedPoint(null);
    }
  };

  const handleConfirmSelection = async (point: PickupPoint) => {
    setSavingPickup(true);
    setPickupFeedback(null);
    try {
      const pickupData: SavedPickupPoint = {
        id: String(point.number ?? point.id),
        name: point.name,
        address: point.address,
        zipcode: point.zipcode,
        city: point.city,
        carrier_code: point.carrier_code,
      };
      const { customer: fresh } = await medusa.store.customer.retrieve();
      const existing = (fresh?.metadata ?? {}) as Record<string, unknown>;
      await medusa.store.customer.update({
        metadata: {
          ...existing,
          preferred_pickup_point: pickupData,
        },
      });
      setSavedPickup(pickupData);
      setPickupFeedback({ type: "success", msg: labels.pickupPointSaved });
      try {
        await refetch();
      } catch {
        /* update persisted; refresh failure is non-fatal */
      }
      setTimeout(() => setPickupFeedback(null), 3000);
    } catch {
      setPickupFeedback({ type: "error", msg: labels.pickupPointError });
    } finally {
      setSavingPickup(false);
    }
  };

  if (!customer) return null;

  const savedCarrierLabel = formatPickupCarrierLabel(savedPickup?.carrier_code);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">{labels.preferredPickupPoint}</h2>

        <div className="mt-4">
          {savedPickup ? (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{savedPickup.name}</p>
                {savedCarrierLabel ? (
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-primary/80">
                    {savedCarrierLabel}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {savedPickup.address}, {savedPickup.zipcode} {savedPickup.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="shrink-0 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
              >
                {labels.change}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{labels.noPickupPointSaved}</p>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                {labels.searchPickupPoint}
              </button>
            </div>
          )}

          {pickupFeedback ? (
            <span
              role={pickupFeedback.type === "error" ? "alert" : "status"}
              aria-live={pickupFeedback.type === "error" ? "assertive" : "polite"}
              aria-atomic="true"
              className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${
                pickupFeedback.type === "success" ? "text-success" : "text-destructive"
              }`}
            >
              {pickupFeedback.type === "success" && <Check className="h-4 w-4" />}
              {pickupFeedback.msg}
            </span>
          ) : null}
        </div>
      </div>

      <PickupPointSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        checkout={checkout}
        locale={locale}
        searchAddress={searchAddress}
        onSearchAddressChange={setSearchAddress}
        pickupLoading={pickupLoading}
        pickupPoints={pickupPoints}
        selectedPoint={selectedPoint}
        onSelectPoint={setSelectedPoint}
        onConfirmSelection={handleConfirmSelection}
        confirmLoading={savingPickup}
        confirmLoadingLabel={labels.saving}
      />
    </div>
  );
}
