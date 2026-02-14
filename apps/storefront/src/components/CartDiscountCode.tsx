"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CartDiscountCodeProps {
  label: string;
  placeholder: string;
  applyLabel: string;
  appliedLabel: string;
  className?: string;
}

export function CartDiscountCode({
  label,
  placeholder,
  applyLabel,
  className,
  appliedLabel,
  className,
}: CartDiscountCodeProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) setApplied(true);
  };

  return (
    <div className={cn("border-b border-border pb-4", className)}>
      <label htmlFor="discount-code" className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </label>
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          id="discount-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          disabled={applied}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!code.trim() || applied}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {applied ? appliedLabel : applyLabel}
        </button>
      </form>
    </div>
  );
}
