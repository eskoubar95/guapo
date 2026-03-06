"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, Search, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { SidebarMenu } from "@/components/SidebarMenu";
import { SearchModal } from "@/components/SearchModal";
import { CartDropdown } from "@/components/CartDropdown";
import type { NavMenuItem } from "@/lib/payload-navigation";
import type { PayloadNavCtaButton } from "@/lib/payload-navigation";

interface HeaderProps {
  locale: string;
  menuItems: NavMenuItem[];
  ctaButton?: PayloadNavCtaButton | null;
}

export function Header({ locale, menuItems, ctaButton }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount] = useState(0); // TODO: Connect to cart
  const [favoriteCount] = useState(0); // TODO: Connect to favorites

  const base = `/${locale}`;
  const showCta = ctaButton?.show && ctaButton?.label && ctaButton?.url;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        locale={locale}
        menuItems={menuItems}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />

      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {/* Top announcement bar */}
        <div className="bg-primary text-primary-foreground py-2 px-4 sm:px-6 text-center">
          <p className="text-xs sm:text-sm">Fri fragt over 299 kr. • 30 dages returret</p>
        </div>

        {/* Main header */}
        <div className="section-container">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4 sm:gap-6">
            {/* Left: Menu button + Logo */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-muted rounded-md transition-colors"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Åbn menu"
              >
                <Menu className="h-5 w-5" />
                <span className="hidden md:inline font-medium text-sm">
                  Menu
                </span>
              </button>
              <Link
                href={base}
                className="flex items-center font-semibold text-lg text-primary shrink-0"
              >
                Guapo
              </Link>
            </div>

            {/* Center: Search bar */}
            <div className="hidden md:block flex-1 max-w-xl">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 h-10 bg-surface hover:bg-surface-muted border border-border rounded-lg transition-colors text-left group"
              >
                <Search className="h-4 w-4 text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-muted flex-1">
                  Søg efter produkter, brands eller hudproblemer...
                </span>
                <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 bg-background border border-border rounded text-xs font-medium text-text-muted">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: CTA (from CMS), Search (mobile), Favorites, Cart, Account */}
            <div className="flex items-center gap-1 shrink-0">
              {showCta && (
                <Link
                  href={ctaButton!.url!}
                  className="hidden md:inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {ctaButton!.label}
                </Link>
              )}
              <button
                type="button"
                className="md:hidden p-2 hover:bg-surface rounded-lg transition-colors"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Søg"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href={`${base}/account`}
                className="p-2 hover:bg-surface rounded-lg transition-colors relative inline-flex"
                aria-label="Konto"
              >
                <Heart className="h-5 w-5" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setIsCartOpen(true)}
                onMouseLeave={() => setIsCartOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsCartOpen((o) => !o)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors relative inline-flex border-0 bg-transparent cursor-pointer"
                  aria-label="Kurv"
                  aria-expanded={isCartOpen}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <CartDropdown
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)}
                  locale={locale}
                />
              </div>

              <Link
                href={`${base}/account`}
                className="p-2 hover:bg-surface rounded-lg transition-colors inline-flex"
                aria-label="Konto"
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
