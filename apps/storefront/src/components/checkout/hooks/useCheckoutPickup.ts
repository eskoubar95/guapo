"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  fetchAllPickupPoints,
  enrichWithDistance,
  type PickupPoint,
} from "@/lib/pickup-points";
import type { ShippingOption } from "@/components/checkout/checkout-shipping.types";
import type { CheckoutFormData } from "@/components/checkout/steps/checkout-form.types";
import type { CarrierCode } from "@/components/checkout/steps/checkout-utils";
import { usePickupPointSheetSearch } from "@/components/checkout/hooks/usePickupPointSheetSearch";
import {
  findDefaultPakkeshopOption,
  findShippingOptionForCarrier,
} from "@/components/checkout/shipping-option-carrier";

interface UseCheckoutPickupParams {
  shippingOptions: ShippingOption[];
  formData: CheckoutFormData;
  initialPickupZipcode: string;
  initialPickupPointId: string;
  onShippingSelect?: (optionId: string, data: Record<string, unknown>) => void;
}

export function useCheckoutPickup({
  shippingOptions,
  formData,
  initialPickupZipcode,
  initialPickupPointId,
  onShippingSelect,
}: UseCheckoutPickupParams) {
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierCode>("gls");
  const [searchAddress, setSearchAddress] = useState("");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pickupPrefillDoneRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDebounceRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** When pickup point is cleared (e.g. search), reset carrier so ReviewStep does not show a stale label. */
  useEffect(() => {
    if (!selectedPoint) {
      setSelectedCarrier("gls");
    }
  }, [selectedPoint]);

  const pakkeshopOption = findDefaultPakkeshopOption(shippingOptions);

  const getOptionForCarrier = useCallback(
    (carrier: CarrierCode) => findShippingOptionForCarrier(shippingOptions, carrier),
    [shippingOptions]
  );

  useEffect(() => {
    if (!onShippingSelect || !pakkeshopOption) return;
    const carrier: CarrierCode =
      selectedPoint?.carrier_code === "pdk"
        ? "pdk"
        : selectedPoint?.carrier_code === "dao"
          ? "dao"
          : "gls";
    const option =
      selectedPoint ? getOptionForCarrier(carrier) ?? pakkeshopOption : pakkeshopOption;
    if (option) {
      onShippingSelect(
        option.id,
        selectedPoint
          ? {
              service_point_id: selectedPoint.number ?? selectedPoint.id,
              service_point_name: selectedPoint.name,
              service_point_address: selectedPoint.address,
              service_point_zipcode: selectedPoint.zipcode,
              service_point_city: selectedPoint.city,
              carrier_code: selectedPoint.carrier_code ?? "gls",
            }
          : {}
      );
    }
  }, [pakkeshopOption, selectedPoint, onShippingSelect, getOptionForCarrier]);

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
    void fetchAllPickupPoints({ zipcode: initialPickupZipcode, country_code: "DK" })
      .then((points) => enrichWithDistance(points, initialPickupZipcode))
      .then((points) => {
        if (!mountedRef.current) return;
        setPickupPoints(points);
        if (initialPickupPointId) {
          const match = points.find(
            (p) => p.number === initialPickupPointId || p.id === initialPickupPointId
          );
          if (match) {
            setSelectedPoint(match);
            setSelectedCarrier(
              match.carrier_code === "dao" ? "dao" : match.carrier_code === "pdk" ? "pdk" : "gls"
            );
          }
        }
      })
      .catch((err) => {
        console.error("[useCheckoutPickup] prefill fetch failed", err);
      })
      .finally(() => {
        if (mountedRef.current) setPickupLoading(false);
      });
  }, [initialPickupZipcode, initialPickupPointId]);

  usePickupPointSheetSearch({
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
  });

  return {
    selectedCarrier,
    searchAddress,
    setSearchAddress,
    pickupPoints,
    pickupLoading,
    selectedPoint,
    sheetOpen,
    setSheetOpen,
    selectPoint,
    getOptionForCarrier,
    pakkeshopOption,
  };
}
