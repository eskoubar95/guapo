"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

// Mock - replace with real cart
const mockCount = 0;

export function CartDropdown({ isOpen, onClose, locale }: CartDropdownProps) {
  const base = `/${locale}`;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="absolute right-0 top-full mt-2 w-[320px] md:w-[400px] bg-background rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
        onMouseLeave={onClose}
        role="dialog"
        aria-label="Kurv"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-primary">Varer i kurven</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-surface rounded-lg transition-colors"
            aria-label="Luk"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">Din kurv er tom</p>
          <Link
            href={`${base}/categories`}
            onClick={onClose}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            Start med at handle
          </Link>
        </div>
      </div>
    </>
  );
}
