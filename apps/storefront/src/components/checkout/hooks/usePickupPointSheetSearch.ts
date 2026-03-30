"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  fetchAllPickupPoints,
  extractZipcodeFromAddress,
  enrichWithDistance,
  type PickupPoint,
} from "@/lib/pickup-points";
import type { CheckoutFormData } from "@/components/checkout/steps/checkout-form.types";

interface UsePickupPointSheetSearchParams {
  sheetOpen: boolean;
  searchAddress: string;
  setSearchAddress: (v: string) => void;
  formData: CheckoutFormData;
  skipNextDebounceRef: MutableRefObject<boolean>;
  debounceRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  mountedRef: MutableRefObject<boolean>;
  setPickupLoading: (v: boolean) => void;
  setPickupPoints: (p: PickupPoint[]) => void;
  setSelectedPoint: Dispatch<SetStateAction<PickupPoint | null>>;
}

/**
 * When the pickup sheet opens: sync search from address fields, and debounced search on typing.
 */
/* eslint-disable react-hooks/exhaustive-deps -- sync effect intentionally omits searchAddress to avoid clobbering typed queries */
export function usePickupPointSheetSearch({
  sheetOpen,
  searchAddress,
  setSearchAddress,
  formData,
  skipNextDebounceRef,
  debounceRef,
  mountedRef,
  setPickupLoading,
  setPickupPoints,
  setSelectedPoint,
}: UsePickupPointSheetSearchParams): void {
  const fetchRequestSeqRef = useRef(0);
  const prevSheetOpenRef = useRef(sheetOpen);
  const lastSyncedFromFormRef = useRef("");

  useEffect(() => {
    if (prevSheetOpenRef.current && !sheetOpen) {
      fetchRequestSeqRef.current += 1;
      lastSyncedFromFormRef.current = "";
    }
    prevSheetOpenRef.current = sheetOpen;
  }, [sheetOpen]);

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
    if (!combined || combined === lastSyncedFromFormRef.current) return;
    lastSyncedFromFormRef.current = combined;
    skipNextDebounceRef.current = true;
    setSearchAddress(combined);
    setPickupLoading(true);
    setPickupPoints([]);
    const digitsOnly = combined.replace(/\D/g, "").slice(0, 4);
    const zipForSearch =
      zip.length >= 3
        ? zip
        : extractZipcodeFromAddress(combined) || (digitsOnly.length >= 3 ? digitsOnly : "");
    if (zipForSearch.length >= 3) {
      const seq = ++fetchRequestSeqRef.current;
      void fetchAllPickupPoints({
        zipcode: zipForSearch,
        country_code: "DK",
        address: combined.length > 4 ? combined : undefined,
      })
        .then((points) => enrichWithDistance(points, combined || zipForSearch))
        .then((points) => {
          if (!mountedRef.current || seq !== fetchRequestSeqRef.current) return;
          setPickupPoints(points);
          setSelectedPoint((prev) => {
            if (!prev) return null;
            const still = points.some((p) => p.id === prev.id || p.number === prev.number);
            return still ? prev : null;
          });
        })
        .catch((err: unknown) => {
          console.error("[usePickupPointSheetSearch] sync fetch failed", err);
        })
        .finally(() => {
          if (mountedRef.current && seq === fetchRequestSeqRef.current) {
            setPickupLoading(false);
          }
        });
    } else {
      setPickupLoading(false);
    }
  }, [sheetOpen, formData.address1, formData.postalCode, formData.city]);

  useEffect(() => {
    if (!sheetOpen) return;
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const zip =
      extractZipcodeFromAddress(searchAddress) ||
      searchAddress.trim().replace(/\D/g, "").slice(0, 4);
    if (zip.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const seq = ++fetchRequestSeqRef.current;
      setPickupLoading(true);
      setPickupPoints([]);
      const addr = searchAddress.trim();
      void fetchAllPickupPoints({
        zipcode: zip,
        country_code: "DK",
        address: addr.length > 4 ? addr : undefined,
      })
        .then((points) => enrichWithDistance(points, addr || zip))
        .then((points) => {
          if (!mountedRef.current || seq !== fetchRequestSeqRef.current) return;
          setPickupPoints(points);
          setSelectedPoint((prev) => {
            if (!prev) return null;
            const still = points.some((p) => p.id === prev.id || p.number === prev.number);
            return still ? prev : null;
          });
        })
        .catch((err: unknown) => {
          console.error("[usePickupPointSheetSearch] debounced fetch failed", err);
        })
        .finally(() => {
          if (mountedRef.current && seq === fetchRequestSeqRef.current) {
            setPickupLoading(false);
          }
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sheetOpen, searchAddress]);
}
/* eslint-enable react-hooks/exhaustive-deps */
