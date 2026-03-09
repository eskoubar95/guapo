"use client";

import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  RefreshCw,
  Gift,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ServiceStripCmsItem {
  iconType?: string;
  iconImageUrl?: string;
  title: string;
  subtitle?: string;
  url?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  subscription: RefreshCw,
  gift: Gift,
  newsletter: Mail,
  truck: Truck,
  shield: ShieldCheck,
  return: RotateCcw,
  headphones: Headphones,
};

interface ServiceStripProps {
  services?: ServiceItem[];
  cmsItems?: ServiceStripCmsItem[];
  variant?: "minimal" | "cards";
  backgroundColor?: string;
}

const defaultServices: ServiceItem[] = [
  { icon: Truck, title: "Hurtig levering", description: "Fri fragt over 499 kr." },
  { icon: ShieldCheck, title: "Sikker betaling", description: "Krypteret & beskyttet" },
  { icon: RotateCcw, title: "30 dages returret", description: "Nem & gratis retur" },
  { icon: Headphones, title: "Kundeservice", description: "Alle hverdage 9–17" },
];

/* ── Shared item type ─────────────────────────────────────── */
interface ResolvedItem {
  icon?: LucideIcon;
  iconImageUrl?: string;
  title: string;
  description: string;
  url?: string;
}

/* ── Minimal variant ──────────────────────────────────────── */
function MinimalCard({ icon: Icon, iconImageUrl, title, description, url }: ResolvedItem) {
  const hasIcon = Icon || iconImageUrl;
  const content = (
    <div className="flex flex-col items-center text-center gap-1.5">
      {hasIcon && (
        <span className="text-primary/80">
          {iconImageUrl ? (
            <ImageWithFallback src={iconImageUrl} alt="" className="w-5 h-5 object-contain" />
          ) : Icon ? (
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          ) : null}
        </span>
      )}
      <span className="text-[13px] font-medium text-text-primary leading-tight tracking-tight">{title}</span>
      {description && <span className="text-[11px] text-text-muted/70 leading-tight">{description}</span>}
    </div>
  );
  const cls = "flex items-center justify-center py-4 px-2 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none";
  if (url) return <Link href={url.startsWith("http") ? url : `/${url.replace(/^\//, "")}`} className={cls}>{content}</Link>;
  return <div className={cls}>{content}</div>;
}

/* ── Cards variant ────────────────────────────────────────── */
function CardItem({ icon: Icon, iconImageUrl, title, description, url }: ResolvedItem) {
  const hasIcon = Icon || iconImageUrl;
  const content = (
    <div className="flex flex-col gap-4 p-6 h-full">
      {hasIcon && (
        <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
          {iconImageUrl ? (
            <ImageWithFallback src={iconImageUrl} alt="" className="w-5 h-5 object-contain" />
          ) : Icon ? (
            <Icon className="h-[18px] w-[18px] text-text-primary" strokeWidth={1.5} />
          ) : null}
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-text-primary leading-tight">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted mt-2 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
  const cls = "block rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors h-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";
  if (url) return <Link href={url.startsWith("http") ? url : `/${url.replace(/^\//, "")}`} className={cls}>{content}</Link>;
  return <div className={cls}>{content}</div>;
}

/* ── Main component ───────────────────────────────────────── */
export function ServiceStrip({
  services = defaultServices,
  cmsItems,
  variant = "minimal",
  backgroundColor = "bg-background",
}: ServiceStripProps) {
  const useCms = cmsItems && cmsItems.length > 0;
  const items: ResolvedItem[] = useCms
    ? cmsItems.map((item) => ({
        icon: item.iconType ? ICON_MAP[item.iconType] : undefined,
        iconImageUrl: item.iconImageUrl,
        title: item.title,
        description: item.subtitle ?? "",
        url: item.url,
      }))
    : services.map((s) => ({ icon: s.icon, title: s.title, description: s.description, url: undefined }));

  const count = Math.min(Math.max(1, items.length), 4);
  const gridColsClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  if (variant === "cards") {
    return (
      <section className={`w-full py-6 sm:py-8 lg:py-10 ${backgroundColor}`}>
        <div className="section-container min-w-0 w-full">
          <div className={`grid w-full gap-4 ${gridColsClass}`}>
            {items.map((item, i) => (
              <CardItem key={i} {...item} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full py-5 sm:py-6 lg:py-6 ${backgroundColor}`}>
      <div className="section-container w-full">
        <div className={`grid w-full ${gridColsClass}`}>
          {items.map((item, index) => (
            <div
              key={index}
              className={index < items.length - 1 ? "lg:border-r lg:border-border/30" : ""}
            >
              <MinimalCard {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
