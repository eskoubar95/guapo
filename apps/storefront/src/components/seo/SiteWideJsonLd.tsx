import { getStorefrontSiteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/JsonLd";

export function SiteWideJsonLd({ locale }: { locale: string }) {
  const base = getStorefrontSiteUrl();
  const loc = locale === "en" ? "en" : "da";
  const data: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Guapo",
      url: base,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Guapo",
      url: base,
      inLanguage: loc === "da" ? "da-DK" : "en",
      publisher: { "@type": "Organization", name: "Guapo", url: base },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${base}/${loc}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
  return <JsonLd data={data} />;
}
