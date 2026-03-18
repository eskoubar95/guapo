"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { fetchPickupPoints, type PickupPoint } from "@/lib/pickup-points";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressManagerLabels {
  addressTitle: string;
  billingAddress: string;
  address: string;
  postalCode: string;
  city: string;
  addressSaved: string;
  addressError: string;
  preferredPickupPoint: string;
  noPickupPointSaved: string;
  searchPickupPoint: string;
  pickupPointSaved: string;
  pickupPointError: string;
  saving: string;
  save: string;
  change: string;
  firstName: string;
  lastName: string;
}

interface AddressManagerProps {
  locale: string;
  labels: AddressManagerLabels;
}

interface SavedPickupPoint {
  id: string;
  name: string;
  address: string;
  zipcode: string;
  city: string;
}

export function AddressManager({ locale, labels }: AddressManagerProps) {
  const { customer, refetch } = useAuth();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [addrFirstName, setAddrFirstName] = useState("");
  const [addrLastName, setAddrLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrFeedback, setAddrFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [savedPickup, setSavedPickup] = useState<SavedPickupPoint | null>(null);
  const [pickupZipcode, setPickupZipcode] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [savingPickup, setSavingPickup] = useState(false);
  const [pickupFeedback, setPickupFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showPickupSearch, setShowPickupSearch] = useState(false);

  useEffect(() => {
    if (!customer) return;
    const meta = customer.metadata as Record<string, unknown> | undefined;
    const pp = meta?.preferred_pickup_point as SavedPickupPoint | undefined;
    if (pp?.id) setSavedPickup(pp);

    medusa.store.customer.listAddress().then(({ addresses }) => {
      const addr = addresses?.[0];
      if (!addr) return;
      setAddressId(addr.id);
      setAddrFirstName(addr.first_name ?? "");
      setAddrLastName(addr.last_name ?? "");
      setAddress1(addr.address_1 ?? "");
      setPostalCode(addr.postal_code ?? "");
      setCity(addr.city ?? "");
    }).catch(() => {});
  }, [customer]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddrFeedback(null);
    try {
      const payload = {
        first_name: addrFirstName,
        last_name: addrLastName,
        address_1: address1,
        postal_code: postalCode,
        city,
        country_code: "dk",
      };
      if (addressId) {
        await medusa.store.customer.updateAddress(addressId, payload);
      } else {
        const { customer: updated } = await medusa.store.customer.createAddress(payload);
        const newAddr = (updated as unknown as { addresses?: { id: string }[] })?.addresses?.slice(-1)[0];
        if (newAddr) setAddressId(newAddr.id);
      }
      setAddrFeedback({ type: "success", msg: labels.addressSaved });
      setTimeout(() => setAddrFeedback(null), 3000);
    } catch {
      setAddrFeedback({ type: "error", msg: labels.addressError });
    } finally {
      setSavingAddress(false);
    }
  };

  const searchPoints = useCallback(async () => {
    if (!pickupZipcode.trim() || pickupZipcode.length < 3) return;
    setPickupLoading(true);
    setPickupPoints([]);
    try {
      const points = await fetchPickupPoints({ zipcode: pickupZipcode.trim(), country_code: "DK", carrier_code: "gls" });
      setPickupPoints(points);
      setSelectedPoint(null);
    } finally {
      setPickupLoading(false);
    }
  }, [pickupZipcode]);

  const handleSavePickup = async () => {
    if (!selectedPoint) return;
    setSavingPickup(true);
    setPickupFeedback(null);
    try {
      const pickupData: SavedPickupPoint = {
        id: selectedPoint.number ?? selectedPoint.id,
        name: selectedPoint.name,
        address: selectedPoint.address,
        zipcode: selectedPoint.zipcode,
        city: selectedPoint.city,
      };
      await medusa.store.customer.update({
        metadata: { preferred_pickup_point: pickupData },
      });
      await refetch();
      setSavedPickup(pickupData);
      setShowPickupSearch(false);
      setPickupPoints([]);
      setSelectedPoint(null);
      setPickupFeedback({ type: "success", msg: labels.pickupPointSaved });
      setTimeout(() => setPickupFeedback(null), 3000);
    } catch {
      setPickupFeedback({ type: "error", msg: labels.pickupPointError });
    } finally {
      setSavingPickup(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Billing address */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{labels.billingAddress}</h2>

          <form onSubmit={handleSaveAddress} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-firstName">{labels.firstName}</Label>
                <Input
                  id="addr-firstName"
                  value={addrFirstName}
                  onChange={(e) => setAddrFirstName(e.target.value)}
                  disabled={savingAddress}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-lastName">{labels.lastName}</Label>
                <Input
                  id="addr-lastName"
                  value={addrLastName}
                  onChange={(e) => setAddrLastName(e.target.value)}
                  disabled={savingAddress}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-address">{labels.address}</Label>
              <Input
                id="addr-address"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                disabled={savingAddress}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-postalCode">{labels.postalCode}</Label>
                <Input
                  id="addr-postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={savingAddress}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-city">{labels.city}</Label>
                <Input
                  id="addr-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={savingAddress}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingAddress}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {savingAddress ? labels.saving : labels.save}
              </button>
              {addrFeedback && (
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${addrFeedback.type === "success" ? "text-success" : "text-destructive"}`}>
                  {addrFeedback.type === "success" && <Check className="h-4 w-4" />}
                  {addrFeedback.msg}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Preferred pickup point */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">{labels.preferredPickupPoint}</h2>

          {savedPickup && !showPickupSearch ? (
            <div className="mt-4">
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{savedPickup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {savedPickup.address}, {savedPickup.zipcode} {savedPickup.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPickupSearch(true)}
                  className="shrink-0 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
                >
                  {labels.change}
                </button>
              </div>
              {pickupFeedback && (
                <span className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${pickupFeedback.type === "success" ? "text-success" : "text-destructive"}`}>
                  {pickupFeedback.type === "success" && <Check className="h-4 w-4" />}
                  {pickupFeedback.msg}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {!savedPickup && !showPickupSearch && (
                <p className="text-sm text-muted-foreground">{labels.noPickupPointSaved}</p>
              )}

              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <Label htmlFor="pickup-zip">{labels.postalCode}</Label>
                <div className="flex gap-2">
                  <Input
                    id="pickup-zip"
                    placeholder="1000"
                    value={pickupZipcode}
                    onChange={(e) => setPickupZipcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPoints())}
                    className="max-w-[140px]"
                  />
                  <button
                    type="button"
                    onClick={searchPoints}
                    disabled={pickupLoading || pickupZipcode.trim().length < 3}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
                  >
                    <Search className="h-3.5 w-3.5" />
                    {pickupLoading
                      ? (locale === "da" ? "Søger…" : "Searching…")
                      : (locale === "da" ? "Søg" : "Search")}
                  </button>
                </div>

                {pickupPoints.length > 0 && (
                  <ul className="max-h-52 space-y-2 overflow-y-auto">
                    {pickupPoints.map((point) => {
                      const isSelected = selectedPoint?.id === point.id || selectedPoint?.number === point.number;
                      return (
                        <li key={point.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedPoint(point)}
                            className={cn(
                              "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                              isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                            )}
                          >
                            <p className="font-medium text-foreground">{point.name}</p>
                            <p className="text-muted-foreground">
                              {point.address}, {point.zipcode} {point.city}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selectedPoint && (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleSavePickup}
                      disabled={savingPickup}
                      className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {savingPickup ? labels.saving : labels.save}
                    </button>
                    {showPickupSearch && savedPickup && (
                      <button
                        type="button"
                        onClick={() => { setShowPickupSearch(false); setPickupPoints([]); setSelectedPoint(null); }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {locale === "da" ? "Annuller" : "Cancel"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {pickupFeedback && (
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${pickupFeedback.type === "success" ? "text-success" : "text-destructive"}`}>
                  {pickupFeedback.type === "success" && <Check className="h-4 w-4" />}
                  {pickupFeedback.msg}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
