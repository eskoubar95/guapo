"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { medusa } from "@/lib/medusa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { PickupPointManager } from "./PickupPointManager";

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
  pickupSearchLoading: string;
  pickupSearchAction: string;
  cancel: string;
}

interface AddressManagerProps {
  labels: AddressManagerLabels;
}

export function AddressManager({ labels }: AddressManagerProps) {
  const { customer } = useAuth();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [addrFirstName, setAddrFirstName] = useState("");
  const [addrLastName, setAddrLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrFeedback, setAddrFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (!customer) return;

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

  if (!customer) return null;

  return (
    <div className="space-y-6">
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

      <PickupPointManager
        labels={{
          preferredPickupPoint: labels.preferredPickupPoint,
          noPickupPointSaved: labels.noPickupPointSaved,
          postalCode: labels.postalCode,
          searchPickupPoint: labels.searchPickupPoint,
          pickupPointSaved: labels.pickupPointSaved,
          pickupPointError: labels.pickupPointError,
          saving: labels.saving,
          save: labels.save,
          change: labels.change,
          searchLoading: labels.pickupSearchLoading,
          searchAction: labels.pickupSearchAction,
          cancel: labels.cancel,
        }}
      />
    </div>
  );
}
