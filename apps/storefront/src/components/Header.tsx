"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, Search, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SidebarMenu } from "@/components/SidebarMenu";
import { SearchModal } from "@/components/SearchModal";
import { CartDropdown } from "@/components/CartDropdown";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import type { NavSection } from "@/lib/payload-navigation";
import type { PayloadNavCtaButton, PayloadNavPromotionBar } from "@/lib/payload-navigation";
import type { Dictionary } from "@/i18n/dictionaries";

interface HeaderProps {
  locale: string;
  dict: Dictionary;
  menuSections: NavSection[];
  promotionBar?: PayloadNavPromotionBar | null;
  ctaButton?: PayloadNavCtaButton | null;
}

/** Hide nav only after scrolling past roughly the first section (hero/banner). */
const FIRST_SECTION_SCROLL_THRESHOLD = 480;
/** Min scroll down (px) to count as "scrolling down" (avoids jitter). */
const SCROLL_DOWN_DELTA = 8;

export function Header({ locale, dict, menuSections, promotionBar, ctaButton }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const base = `/${locale}`;
  const showCta = ctaButton?.show && ctaButton?.label && ctaButton?.url;
  const showPromo = promotionBar?.show && promotionBar?.text;

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

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const last = lastScrollYRef.current;

          // Near top or not past first section: always show
          if (y <= FIRST_SECTION_SCROLL_THRESHOLD) {
            setHeaderVisible(true);
            lastScrollYRef.current = y;
            ticking = false;
            return;
          }

          // Past first section: hide on scroll down, show on scroll up
          const scrollingDown = y > last + SCROLL_DOWN_DELTA;
          const scrollingUp = y < last;

          if (scrollingUp) {
            setHeaderVisible(true);
          } else if (scrollingDown) {
            setHeaderVisible(false);
          }
          lastScrollYRef.current = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        locale={locale}
        sections={menuSections}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
        dict={dict}
      />

      {/* Promotion bar: only at top of page, scrolls away (not part of sticky nav) */}
      {showPromo && (
        <div className="bg-primary text-primary-foreground py-2 px-4 sm:px-6 text-center">
          {promotionBar!.url ? (
            <Link
              href={promotionBar!.url}
              className="block text-xs sm:text-sm hover:underline focus:outline focus:underline"
            >
              {promotionBar!.text}
            </Link>
          ) : (
            <p className="text-xs sm:text-sm">{promotionBar!.text}</p>
          )}
        </div>
      )}

      {/* Sticky main nav: hides after scrolling down past MIN_SCROLL_BEFORE_HIDE, shows when scrolling up */}
      <header
        className={`sticky top-0 z-40 w-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-out ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
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
                className="flex items-center shrink-0"
                aria-label="Guapo – forside"
              >
                <img
                  src="/logos/GUAPO_default.svg"
                  alt="Guapo"
                  className="h-5 sm:h-6 w-auto"
                  width={856}
                  height={157}
                />
              </Link>
            </div>

            {/* Center: Search bar */}
            <div className="hidden md:block flex-1 max-w-xl">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 h-10 bg-surface hover:bg-surface-muted border border-border rounded-lg transition-colors text-left group"
              >
                <Search className="h-4 w-4 text-text-muted shrink-0" />
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
                href={`${base}/wishlist`}
                className="p-2 hover:bg-surface rounded-lg transition-colors relative inline-flex"
                aria-label="Ønskeliste"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Mobile/tablet: cart icon links directly to cart page */}
              <Link
                href={`${base}/cart`}
                className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors relative inline-flex"
                aria-label="Kurv"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* Desktop: hover dropdown */}
              <div
                className="hidden lg:block relative"
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
                  dict={dict}
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
