"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { NavSection } from "@/lib/payload-navigation";
import type { PayloadNavPromotionBar, PayloadNavCtaButton } from "@/lib/payload-navigation";
import type { ResolvedFooter } from "@/lib/payload-footer";
import type { Dictionary } from "@/i18n/dictionaries";

interface AuthAwareShellProps {
  children: React.ReactNode;
  locale: string;
  dict: Dictionary;
  menuSections: NavSection[];
  promotionBar?: PayloadNavPromotionBar | null;
  ctaButton?: PayloadNavCtaButton | null;
  footer: ResolvedFooter | null;
}

export function AuthAwareShell({
  children,
  locale,
  dict,
  menuSections,
  promotionBar,
  ctaButton,
  footer,
}: AuthAwareShellProps) {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const lastSegment = segments[segments.length - 1];
  const isAuthPage = lastSegment === "login" || lastSegment === "register";
  const isCheckoutPage = lastSegment === "checkout";

  if (isAuthPage || isCheckoutPage) {
    return (
      <main id="main" className="flex-1 min-w-0 overflow-x-clip">
        {children}
      </main>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        {locale === "da" ? "Spring til indhold" : "Skip to main content"}
      </a>
      <Header
        locale={locale}
        dict={dict}
        menuSections={menuSections}
        promotionBar={promotionBar ?? undefined}
        ctaButton={ctaButton ?? undefined}
      />
      <main id="main" className="flex-1 min-w-0 overflow-x-clip">
        {children}
      </main>
      <Footer locale={locale} footer={footer} />
    </>
  );
}
