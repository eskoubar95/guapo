import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const bgClassMap = {
  "light-blue": "bg-sky-50",
  "light-gray": "bg-muted",
  white: "bg-white",
} as const;

export interface ImageTextBreakoutSectionProps {
  imageUrl: string;
  imagePosition: "left" | "right";
  heading: string;
  body?: string | null;
  ctaText: string;
  ctaUrl: string;
  imageColumnBackground?: "light-blue" | "light-gray" | "white" | null;
  locale: string;
}

export function ImageTextBreakoutSection({
  imageUrl,
  imagePosition,
  heading,
  body,
  ctaText,
  ctaUrl,
  imageColumnBackground = "light-blue",
  locale,
}: ImageTextBreakoutSectionProps) {
  const bgClass = bgClassMap[imageColumnBackground ?? "light-blue"];
  const href = ctaUrl.startsWith("http")
    ? ctaUrl
    : `/${locale}${ctaUrl.startsWith("/") ? ctaUrl : `/${ctaUrl}`}`;

  const isLeft = imagePosition === "left";

  return (
    <section className="my-12 sm:my-16 lg:my-24 bg-background overflow-x-clip">
      {/* Full-width band: no max-width, edge-to-edge with safe horizontal padding */}
      <div className="w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2 overflow-visible">
        {/* Mobile: stacked. Tablet (md)+: two columns, same layout as desktop with scaled image. */}
        <div className={`${bgClass} overflow-visible min-h-0 py-6 sm:py-8 md:py-0 md:h-[240px] lg:h-[280px] xl:h-[320px] relative`}>
          <div className="w-full h-full min-h-0 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 lg:gap-10 h-full min-h-0 items-stretch">

              {/* Image: mobile = same horizontal padding as text; tablet+ = absolute breakout */}
              <div
                className={`relative flex items-center justify-center overflow-hidden md:overflow-visible
                  h-[200px] sm:h-[240px] md:h-full
                  px-4 sm:px-6 md:px-0
                  ${isLeft ? "order-1" : "order-1 md:order-2"}`}
              >
                {/* Mobile only: fills row, aligns with text */}
                <div className="md:hidden w-full h-full rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                {/* Tablet + desktop: absolute breakout, size scales with breakpoint */}
                <div className="hidden md:flex absolute left-0 right-0 top-1/2 -translate-y-1/2 justify-center pointer-events-none">
                  <div
                    className="w-full max-w-[280px] md:max-w-md lg:max-w-lg h-[220px] md:h-[260px] lg:h-[320px] xl:h-[380px] pointer-events-auto overflow-hidden isolate"
                    style={{ borderRadius: "var(--radius-lg)" }}
                  >
                    <ImageWithFallback
                      src={imageUrl}
                      alt=""
                      className="block w-full h-full object-contain object-center"
                      style={{ borderRadius: "var(--radius-lg)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Text column */}
              <div
                className={`flex flex-col justify-center py-6 sm:py-8 md:py-8 lg:py-10 px-4 sm:px-6 md:px-6 lg:px-10 xl:px-12 min-h-0
                  ${isLeft ? "order-2" : "order-2 md:order-1"}`}
              >
                <h2 className="section-heading text-text-primary">
                  {heading}
                </h2>
                {body && (
                  <p className="mt-3 text-text-secondary text-sm">
                    {body}
                  </p>
                )}
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center text-sm md:text-base font-medium text-text-primary underline underline-offset-4 hover:no-underline"
                >
                  {ctaText}
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
