"use client";

import { useState } from "react";

interface SubscriptionSelectorProps {
  basePrice: number;
  currency: string;
  locale: string;
  onSelect: (type: "one-time" | "subscription", cycle?: number) => void;
}

const SUBSCRIPTION_DISCOUNT = 0.05; // 5% discount
const CYCLES = [4, 8, 12] as const;

export function SubscriptionSelector({
  basePrice,
  currency,
  locale,
  onSelect,
}: SubscriptionSelectorProps) {
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">("one-time");
  const [selectedCycle, setSelectedCycle] = useState<number>(8);

  const subscriptionPrice = Math.round(basePrice * (1 - SUBSCRIPTION_DISCOUNT));
  const savings = basePrice - subscriptionPrice;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const handleTypeChange = (type: "one-time" | "subscription") => {
    setPurchaseType(type);
    onSelect(type, type === "subscription" ? selectedCycle : undefined);
  };

  const handleCycleChange = (cycle: number) => {
    setSelectedCycle(cycle);
    onSelect("subscription", cycle);
  };

  const labels = {
    da: {
      oneTime: "Engangskøb",
      subscription: "Abonnement",
      savePercent: "Spar 5%",
      everyWeeks: "uger",
      whySubscribe: "Hvorfor abonnere?",
      benefits: [
        "Spar 5% på alle fornyelser",
        "Fleksibel levering - pause eller skip når som helst",
        "Annuller efter 2 leveringer",
      ],
    },
    en: {
      oneTime: "One-time purchase",
      subscription: "Subscription",
      savePercent: "Save 5%",
      everyWeeks: "weeks",
      whySubscribe: "Why subscribe?",
      benefits: [
        "Save 5% on all renewals",
        "Flexible delivery - pause or skip anytime",
        "Cancel after 2 deliveries",
      ],
    },
  };

  const t = labels[locale as "da" | "en"] || labels.en;

  return (
    <div className="space-y-4">
      {/* One-time option */}
      <label
        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
          purchaseType === "one-time"
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="purchaseType"
            checked={purchaseType === "one-time"}
            onChange={() => handleTypeChange("one-time")}
            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="font-medium text-gray-900">{t.oneTime}</span>
        </div>
        <span className="font-semibold text-gray-900">{formatPrice(basePrice)}</span>
      </label>

      {/* Subscription option */}
      <div
        className={`rounded-lg border transition-colors ${
          purchaseType === "subscription"
            ? "border-gray-900"
            : "border-gray-200"
        }`}
      >
        <label
          className={`flex cursor-pointer items-center justify-between p-4 ${
            purchaseType === "subscription" ? "bg-gray-50" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="purchaseType"
              checked={purchaseType === "subscription"}
              onChange={() => handleTypeChange("subscription")}
              className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <span className="font-medium text-gray-900">{t.subscription}</span>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {t.savePercent}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-semibold text-gray-900">{formatPrice(subscriptionPrice)}</span>
            <p className="text-xs text-gray-500">
              {locale === "da" ? `Spar ${formatPrice(savings)}` : `Save ${formatPrice(savings)}`}
            </p>
          </div>
        </label>

        {/* Cycle selector (only shown when subscription selected) */}
        {purchaseType === "subscription" && (
          <div className="border-t border-gray-100 p-4">
            <p className="mb-3 text-sm text-gray-600">
              {locale === "da" ? "Leveringsfrekvens" : "Delivery frequency"}
            </p>
            <div className="flex gap-2">
              {CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => handleCycleChange(cycle)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedCycle === cycle
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {cycle} {t.everyWeeks}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Why subscribe info */}
      {purchaseType === "subscription" && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-900">{t.whySubscribe}</p>
          <ul className="space-y-1">
            {t.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
