"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, RefreshCw } from "lucide-react";

export interface AccountLayoutLabels {
  accountTitle: string;
  overview: string;
  orders: string;
  subscriptions: string;
}

interface AccountLayoutProps {
  locale: string;
  labels: AccountLayoutLabels;
  children: React.ReactNode;
}

const linkIconMap = {
  overview: User,
  orders: Package,
  subscriptions: RefreshCw,
} as const;

export function AccountLayout({ locale, labels, children }: AccountLayoutProps) {
  const pathname = usePathname();

  const links: { href: string; label: string; key: keyof typeof linkIconMap }[] = [
    { href: `/${locale}/account`, label: labels.overview, key: "overview" },
    { href: `/${locale}/account/orders`, label: labels.orders, key: "orders" },
    { href: `/${locale}/account/subscriptions`, label: labels.subscriptions, key: "subscriptions" },
  ];

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <aside className="md:col-span-1">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 font-semibold text-foreground">{labels.accountTitle}</h2>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = linkIconMap[link.key];
                  const isActive =
                    link.href === pathname ||
                    (link.key !== "overview" && pathname.startsWith(link.href + "/"));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
