"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifyPrimaryHeroMediaReady } from "@/components/home/HomePrimaryHeroLoadGate";

interface HeroSectionProps {
  heading: string;
  subheading?: string;
  backgroundImageUrl?: string;
  /** From Payload hero CTA URL — full-bleed tap target on the image (no visible button). */
  linkHref?: string;
  variant?: "full" | "split" | "video";
  textPosition?: "left" | "center" | "right";
  textColor?: "light" | "dark";
  /** 1 = page title (one per page), 2 = section heading */
  headingLevel?: 1 | 2;
  /** First CMS section: skeleton, fetch priority, homepage load gate integration */
  prioritizeAboveFold?: boolean;
}

export function HeroSection({
  heading,
  subheading,
  backgroundImageUrl,
  linkHref,
  variant = "full",
  textPosition = "center",
  textColor = "light",
  headingLevel = 1,
  prioritizeAboveFold = false,
}: HeroSectionProps) {
  const isLight = textColor === "light";
  const textCls = isLight ? "text-primary-foreground" : "text-text-primary";
  const overlayCls = isLight ? "bg-black/50" : "bg-white/40";
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";
  const notifyPageReady = useNotifyPrimaryHeroMediaReady();
  const imgRef = useRef<HTMLImageElement>(null);
  const [heroBgReady, setHeroBgReady] = useState(false);
  const isPrimaryLcpHero = prioritizeAboveFold && Boolean(backgroundImageUrl);

  const signalHeroMediaReady = useCallback(() => {
    setHeroBgReady(true);
    notifyPageReady?.();
  }, [notifyPageReady]);

  useLayoutEffect(() => {
    if (!isPrimaryLcpHero) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalHeight > 0) {
      signalHeroMediaReady();
    }
  }, [backgroundImageUrl, isPrimaryLcpHero, signalHeroMediaReady]);

  const imageLinkOverlay =
    linkHref != null && linkHref !== "" ? (
      <Link
        href={linkHref}
        className="absolute inset-0 z-[4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={heading}
      >
        <span className="sr-only">{heading}</span>
      </Link>
    ) : null;

  if (variant === "full" && backgroundImageUrl) {
    return (
      <section className="relative py-12 lg:py-20 min-h-[320px] lg:min-h-[420px] flex items-center bg-background overflow-hidden">
        {isPrimaryLcpHero && (
          <div
            className={`absolute inset-0 z-[1] transition-opacity duration-500 ${
              heroBgReady ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden
          >
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          </div>
        )}
        <ImageWithFallback
          ref={imgRef}
          src={backgroundImageUrl}
          alt=""
          fetchPriority={isPrimaryLcpHero ? "high" : undefined}
          loading={isPrimaryLcpHero ? "eager" : undefined}
          className={`absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-500 ${
            isPrimaryLcpHero && !heroBgReady ? "opacity-0" : "opacity-100"
          }`}
          onLoad={isPrimaryLcpHero ? signalHeroMediaReady : undefined}
          onError={isPrimaryLcpHero ? signalHeroMediaReady : undefined}
        />
        <div className={`absolute inset-0 z-[2] ${overlayCls}`} />
        <div className={`section-container relative z-[3] ${linkHref ? "pointer-events-none" : ""}`}>
          <div
            className={`max-w-2xl ${
              textPosition === "center" ? "text-center mx-auto" : textPosition === "right" ? "text-right ml-auto" : ""
            }`}
          >
            <HeadingTag
              className={`mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${textCls}`}
            >
              {heading}
            </HeadingTag>
            {subheading && <p className={`text-lg md:text-xl ${isLight ? "text-primary-foreground/90" : "text-text-muted"}`}>{subheading}</p>}
          </div>
        </div>
        {imageLinkOverlay}
      </section>
    );
  }

  if (variant === "split" && backgroundImageUrl) {
    return (
      <section className="py-10 lg:py-14 bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] min-h-[240px] order-2 lg:order-1">
              {isPrimaryLcpHero && (
                <div
                  className={`absolute inset-0 z-[1] transition-opacity duration-500 ${
                    heroBgReady ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                  aria-hidden
                >
                  <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                </div>
              )}
              <ImageWithFallback
                ref={imgRef}
                src={backgroundImageUrl}
                alt=""
                fetchPriority={isPrimaryLcpHero ? "high" : undefined}
                loading={isPrimaryLcpHero ? "eager" : undefined}
                className={`relative z-0 h-full w-full object-cover transition-opacity duration-500 ${
                  isPrimaryLcpHero && !heroBgReady ? "opacity-0" : "opacity-100"
                }`}
                onLoad={isPrimaryLcpHero ? signalHeroMediaReady : undefined}
                onError={isPrimaryLcpHero ? signalHeroMediaReady : undefined}
              />
              {linkHref ? (
                <Link
                  href={linkHref}
                  className="absolute inset-0 z-[4] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={heading}
                >
                  <span className="sr-only">{heading}</span>
                </Link>
              ) : null}
            </div>
            <div className="flex flex-col justify-center order-1 lg:order-2 text-left">
              <HeadingTag className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {heading}
              </HeadingTag>
              {subheading && <p className="text-lg text-text-muted">{subheading}</p>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 lg:py-16 bg-surface-muted/50">
      <div className={`section-container relative z-[1] ${linkHref ? "pointer-events-none" : ""}`}>
        <div className={`max-w-3xl ${textPosition === "center" ? "text-center mx-auto" : ""}`}>
          <HeadingTag className="mb-4 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl">
            {heading}
          </HeadingTag>
          {subheading && <p className="text-text-muted">{subheading}</p>}
        </div>
      </div>
      {imageLinkOverlay}
    </section>
  );
}
