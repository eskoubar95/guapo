"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { User, Package, RefreshCw, UserPen, MapPin, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AccountLayoutLabels {
  accountTitle: string
  overview: string
  orders: string
  subscriptions: string
  profile: string
  addresses: string
  loading: string
  menuLabel?: string
  closeMenu?: string
}

interface AccountLayoutProps {
  locale: string
  labels: AccountLayoutLabels
  children: React.ReactNode
}

const linkIconMap = {
  overview: User,
  orders: Package,
  subscriptions: RefreshCw,
  profile: UserPen,
  addresses: MapPin,
} as const

type LinkKey = keyof typeof linkIconMap

/** Below main `Header` sticky bar (`h-14` / `sm:h-16`) + small gap — keeps account stickies from sliding under the nav */
const ACCOUNT_STICKY_TOP =
  "top-[calc(3.5rem+0.75rem)] sm:top-[calc(4rem+0.75rem)]"

const links = (locale: string, labels: AccountLayoutLabels): { href: string; label: string; key: LinkKey }[] => [
  { href: `/${locale}/account`, label: labels.overview, key: "overview" },
  { href: `/${locale}/account/orders`, label: labels.orders, key: "orders" },
  { href: `/${locale}/account/subscriptions`, label: labels.subscriptions, key: "subscriptions" },
  { href: `/${locale}/account/profile`, label: labels.profile, key: "profile" },
  { href: `/${locale}/account/addresses`, label: labels.addresses, key: "addresses" },
]

function getCurrentSectionLabel(pathname: string, locale: string, labels: AccountLayoutLabels): string {
  if (pathname === `/${locale}/account` || pathname === `/${locale}/account/`) return labels.overview
  if (pathname.startsWith(`/${locale}/account/orders`)) return labels.orders
  if (pathname.startsWith(`/${locale}/account/subscriptions`)) return labels.subscriptions
  if (pathname.startsWith(`/${locale}/account/profile`)) return labels.profile
  if (pathname.startsWith(`/${locale}/account/addresses`)) return labels.addresses
  return labels.accountTitle
}

function NavLinks({
  pathname,
  locale,
  labels,
  onLinkClick,
  className,
  linkClassName,
}: {
  pathname: string
  locale: string
  labels: AccountLayoutLabels
  onLinkClick?: () => void
  className?: string
  linkClassName?: (isActive: boolean) => string
}) {
  const items = links(locale, labels)
  const defaultLinkClass = (isActive: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )
  const getClass = linkClassName ?? defaultLinkClass

  return (
    <nav className={cn("space-y-1", className)} aria-label={labels.accountTitle}>
      {items.map((link) => {
        const Icon = linkIconMap[link.key]
        const isActive =
          link.href === pathname || (link.key !== "overview" && pathname.startsWith(link.href + "/"))
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={getClass(isActive)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{link.label}</span>
            <ChevronRight
              className={cn(
                "ml-auto h-4 w-4 transition-opacity",
                isActive ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-60"
              )}
              aria-hidden
            />
          </Link>
        )
      })}
    </nav>
  )
}

export function AccountLayout({ locale, labels, children }: AccountLayoutProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuLabel = labels.menuLabel ?? labels.accountTitle
  const closeMenuLabel = labels.closeMenu ?? "Close menu"
  const currentSection = getCurrentSectionLabel(pathname, locale, labels)

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    if (menuOpen) {
      window.addEventListener("keydown", handleEscape)
      return () => window.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

  return (
    <div className="min-h-full">
      {/* Mobile: trigger — sticky below site header so it does not sit under the nav */}
      <div
        className={cn(
          "sticky z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden",
          ACCOUNT_STICKY_TOP
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={menuLabel}
          aria-expanded={menuOpen}
        >
          <span className="font-medium">{labels.accountTitle}</span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span className="max-w-[160px] truncate">{currentSection}</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </button>
      </div>

      {/* Mobile: bottom sheet menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-card shadow-xl transition-transform duration-200 ease-out md:hidden",
              menuOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="flex max-h-[78vh] flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-semibold text-foreground">{labels.accountTitle}</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={closeMenuLabel}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3 pb-6">
                <NavLinks
                  pathname={pathname}
                  locale={locale}
                  labels={labels}
                  onLinkClick={() => setMenuOpen(false)}
                  linkClassName={(isActive) =>
                    cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block md:shrink-0">
            <div className={cn("sticky rounded-2xl border border-border bg-card p-4", ACCOUNT_STICKY_TOP)}>
              <div className="mb-4 rounded-xl bg-muted/40 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.accountTitle}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{currentSection}</p>
              </div>
              <NavLinks pathname={pathname} locale={locale} labels={labels} />
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
