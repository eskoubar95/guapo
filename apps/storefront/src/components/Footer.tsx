"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";

interface FooterProps {
  locale: string;
}

const footerSections = (locale: string) => [
  {
    title: "Shop",
    links: [
      { name: "Alle produkter", href: `/${locale}/categories` },
      { name: "Brands", href: `/${locale}/brands` },
      { name: "Concerns", href: `/${locale}/concerns` },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "FAQ", href: `/${locale}/support/faq` },
      { name: "Kontakt os", href: `/${locale}/support/contact` },
      { name: "Returner", href: `/${locale}/policies/returns` },
    ],
  },
  {
    title: "Om Guapo",
    links: [
      { name: "Blog", href: `/${locale}/blog` },
    ],
  },
  {
    title: "Juridisk",
    links: [
      { name: "Handelsbetingelser", href: `/${locale}/policies/terms` },
      { name: "Privatlivspolitik", href: `/${locale}/policies/privacy` },
      { name: "Cookie politik", href: `/${locale}/policies/cookies` },
    ],
  },
];

export function Footer({ locale }: FooterProps) {
  const sections = footerSections(locale);
  return (
    <footer className="bg-[#F8F9FB] border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 mb-8">
          <div className="max-w-md">
            <h3 className="font-semibold text-foreground mb-2">
              Tilmeld dig vores nyhedsbrev
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Få de nyeste tips, eksklusive tilbud og produktnyheder direkte i din indbakke
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Din email"
                aria-label="Email til nyhedsbrev"
                className="flex-1 px-4 py-2 bg-background border-2 border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
              >
                Tilmeld
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Guapo. Alle rettigheder forbeholdes.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>MobilePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
