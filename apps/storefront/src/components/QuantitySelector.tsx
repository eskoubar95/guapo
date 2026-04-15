"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface QuantitySelectorProps {
  defaultQuantity?: number;
  min?: number;
  max?: number;
  onQuantityChange?: (quantity: number) => void;
  label?: string;
}

export function QuantitySelector({
  defaultQuantity = 1,
  min = 1,
  max = 99,
  onQuantityChange,
  label = "Antal",
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(defaultQuantity);

  const handleChange = (newQuantity: number) => {
    if (newQuantity < min || newQuantity > max) return;
    setQuantity(newQuantity);
    onQuantityChange?.(newQuantity);
  };

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-foreground">{label}</label>
      <div className="flex w-fit items-center gap-3 rounded-lg bg-muted/50 p-2">
        <button
          type="button"
          onClick={() => handleChange(quantity - 1)}
          disabled={quantity <= min}
          className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4 text-foreground" />
        </button>
        <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
        <button
          type="button"
          onClick={() => handleChange(quantity + 1)}
          disabled={quantity >= max}
          className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
