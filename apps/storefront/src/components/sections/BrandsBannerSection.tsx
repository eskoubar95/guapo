"use client";

import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { BrandsBannerBrandItem } from "@/lib/payload-homepage";
import type { PayloadMedia } from "@/lib/payload-homepage";

interface BrandsBannerSectionProps {
  heading: string;
  brands: BrandsBannerBrandItem[];
  displayType?: "scroll" | "grid";
  locale: string;
  payloadBaseUrl: string;
}

function logoUrl(logo: BrandsBannerBrandItem["logo"], base: string): string {
  if (!logo) return "";
  if (typeof logo === "number") return "";
  const m = logo as PayloadMedia;
  if (m.url) return m.url.startsWith("http") ? m.url : `${base}${m.url}`;
  return "";
}

export function BrandsBannerSection({
  heading,
  brands,
  displayType = "scroll",
  locale,
  payloadBaseUrl,
}: BrandsBannerSectionProps) {
  if (!brands.length) return null;

  const brandItems = brands.map((b) => {
    const name = b.name ?? (typeof b.brand === "object" && b.brand && "name" in b.brand ? (b.brand as { name?: string }).name : null) ?? "Brand";
    const url = b.url ?? (typeof b.brand === "object" && b.brand && "brandKey" in b.brand ? `/${locale}/brands/${(b.brand as { brandKey?: string }).brandKey}` : "#");
    const href = url.startsWith("/") ? url : `/${locale}${url}`;
    const img = logoUrl(b.logo, payloadBaseUrl);
    return { name, href, img };
  });

  const brandLink = (b: (typeof brandItems)[number], i: number, uniform = false) => (
    <Link
      key={`${b.name}-${i}`}
      href={b.href}
      className={`flex items-center justify-center shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-[grayscale,opacity] duration-300 focus-visible:opacity-100 focus-visible:grayscale-0 focus-visible:outline-none ${uniform ? "w-full h-10" : "px-6 h-16"}`}
    >
      {b.img ? (
        <ImageWithFallback src={b.img} alt={b.name} className={`w-auto object-contain ${uniform ? "max-h-7" : "max-h-10"}`} />
      ) : (
        <span className={`font-semibold text-text-primary whitespace-nowrap ${uniform ? "text-xs" : "text-base"}`}>{b.name}</span>
      )}
    </Link>
  );

  if (displayType === "grid") {
    return (
      <section className="py-6 lg:py-8 bg-background">
        <div className="section-container">
          <div
            className="grid items-center justify-items-center gap-4"
            style={{ gridTemplateColumns: `repeat(${brandItems.length}, minmax(0, 1fr))` }}
          >
            {brandItems.map((b, i) => brandLink(b, i, true))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-10 bg-background overflow-hidden">
      <div className="section-container">
        <div className="relative">
          <div className="flex items-center gap-10 md:gap-14 animate-scroll-x">
            {brandItems.map((b, i) => brandLink(b, i))}
            {brandItems.map((b, i) => brandLink(b, i + brandItems.length))}
          </div>
        </div>
      </div>
    </section>
  );
}
