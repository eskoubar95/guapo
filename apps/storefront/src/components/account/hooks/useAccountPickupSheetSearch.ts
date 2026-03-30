"use client";

import { useEffect, useRef } from "react";
import {
  fetchAllPickupPoints,
  extractZipcodeFromAddress,
  enrichWithDistance,
  type PickupPoint,
} from "@/lib/pickup-points";

interface UseAccountPickupSheetSearchParams {
  sheetOpen: boolean;
  searchAddress: string;
  setSearchAddress: (v: string) => void;
  /** Street + zip + city (or zip-only) — prefills pickup search when sheet opens */
  seedSearchOnOpen: string;
  setPickupLoading: (v: boolean) => void;
  setPickupPoints: (p: PickupPoint[]) => void;
  setSelectedPoint: (p: PickupPoint | null) => void;
}

/**
 * Debounced multi-carrier pickup search for account settings (same APIs as checkout sheet).
 * Seeds search when the sheet opens (matches checkout combined address string), without checkout hooks.
 */
export function useAccountPickupSheetSearch({
  sheetOpen,
  searchAddress,
  setSearchAddress,
  seedSearchOnOpen,
  setPickupLoading,
  setPickupPoints,
  setSelectedPoint,
}: UseAccountPickupSheetSearchParams): void {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const justOpened = sheetOpen && !prevOpenRef.current;
    prevOpenRef.current = sheetOpen;
    if (!justOpened) return;
    const seed = seedSearchOnOpen.trim();
    const zipOnly = seed.replace(/\D/g, "").slice(0, 4);
    const seedUsable = seed.length >= 3 || zipOnly.length >= 3;
    if (seedUsable && searchAddress.trim().length < 3) {
      setSearchAddress(seed.length >= 3 ? seed : zipOnly);
    }
  }, [sheetOpen, seedSearchOnOpen, searchAddress, setSearchAddress]);

  useEffect(() => {
    if (!sheetOpen) return;
    const zip =
      extractZipcodeFromAddress(searchAddress) ||
      searchAddress.trim().replace(/\D/g, "").slice(0, 4);
    if (zip.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
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
          if (!mountedRef.current) return;
          setPickupPoints(points);
          setSelectedPoint(null);
        })
        .finally(() => {
          if (mountedRef.current) setPickupLoading(false);
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sheetOpen, searchAddress, setPickupLoading, setPickupPoints, setSelectedPoint]);
}
