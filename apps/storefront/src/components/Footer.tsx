"use client";

import Link from "next/link";
import { Linkedin } from "lucide-react";
import {
  SiFacebook,
  SiInstagram,
  SiYoutube,
  SiX,
  SiTiktok,
} from "@icons-pack/react-simple-icons";
import { NewsletterForm } from "@/components/NewsletterForm";
import type { ResolvedFooter, ResolvedFooterColumn } from "@/lib/payload-footer";

type SocialIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  color?: string;
}>;

const SOCIAL_ICONS: Record<string, SocialIconComponent> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  youtube: SiYoutube,
  linkedin: Linkedin,
  twitter: SiX,
  tiktok: SiTiktok,
};

function getDefaultColumns(locale: string): ResolvedFooterColumn[] {
  const base = `/${locale}`;
  return [
    {
      title: "Shop",
      links: [
        { label: "Alle produkter", href: `${base}/categories` },
        { label: "Brands", href: `${base}/brands` },
        { label: "Concerns", href: `${base}/concerns` },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: `${base}/support/faq` },
        { label: "Kontakt os", href: `${base}/support/contact` },
        { label: "Returner", href: `${base}/policies/returns` },
      ],
    },
  ];
}

interface FooterProps {
  locale: string;
  footer: ResolvedFooter | null;
}

export function Footer({ locale, footer }: FooterProps) {
  const columns =
    footer?.columns?.length ? footer.columns : getDefaultColumns(locale);
  const showNewsletter = !footer || footer.newsletter?.show !== false;
  const newsletterTitle =
    footer?.newsletter?.title ?? "Tilmeld dig vores nyhedsbrev";
  const newsletterDescription =
    footer?.newsletter?.description ??
    "Få de nyeste tips, eksklusive tilbud og produktnyheder direkte i din indbakke";
  const copyright = footer?.copyright ?? `© ${new Date().getFullYear()} Guapo. Alle rettigheder forbeholdes.`;
  const socialLinks = footer?.socialLinks ?? [];

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="section-container py-10 sm:py-12">
        {/* 8-col grid: newsletter first (3 cols), then link columns (2 cols each). */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-6 sm:gap-8 mb-8">
          {/* Newsletter: 3/8 width, first. */}
          {showNewsletter && (
            <div className="min-w-0 md:col-span-3 order-first md:order-first">
              <h3 className="font-semibold text-text-primary mb-2">
                {newsletterTitle}
              </h3>
              <p className="text-sm text-text-muted mb-4">
                {newsletterDescription}
              </p>
              <NewsletterForm
                locale={locale}
                placeholder={locale === "da" ? "Din email" : "Your email"}
                submitLabel={locale === "da" ? "Tilmeld" : "Subscribe"}
                layout="inline"
              />
            </div>
          )}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="font-semibold text-text-primary mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? "noopener noreferrer" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-text-muted">{copyright}</div>
          <div className="flex items-center gap-4">
            {socialLinks.map((s) => {
              const Icon = s.platform
                ? SOCIAL_ICONS[s.platform.toLowerCase()] ?? SiInstagram
                : null;
              if (!Icon || !s.url) return null;
              const isLucide = Icon === Linkedin;
              return (
                <a
                  key={s.platform + s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors inline-flex items-center justify-center"
                  aria-label={s.platform ?? "Social"}
                >
                  {isLucide ? (
                    <Linkedin className="h-5 w-5" />
                  ) : (
                    <Icon size={20} color="currentColor" />
                  )}
                </a>
              );
            })}
            {socialLinks.length === 0 && (
              <>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors inline-flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <SiFacebook size={20} color="currentColor" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors inline-flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <SiInstagram size={20} color="currentColor" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors inline-flex items-center justify-center"
                  aria-label="YouTube"
                >
                  <SiYoutube size={20} color="currentColor" />
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <img
              src="/payment_icons/Visa%20Inc./Visa%20Inc._idDUM8TcN7_0.svg"
              alt="Visa"
              className="h-4 w-auto object-contain opacity-80"
            />
            <img
              src="/payment_icons/Mastercard/Mastercard_Symbol_0.svg"
              alt="Mastercard"
              className="h-4 w-auto object-contain opacity-80"
            />
            <img
              src="/payment_icons/MobilePay/MobilePay_idhpdSgYek_1.svg"
              alt="MobilePay"
              className="h-4 w-auto object-contain opacity-80"
            />
            <img
              src="/payment_icons/Klarna/Klarna_Logo_0.svg"
              alt="Klarna"
              className="h-4 w-auto object-contain opacity-80"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
