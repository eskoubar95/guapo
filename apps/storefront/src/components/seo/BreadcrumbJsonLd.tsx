import { JsonLd } from "@/components/seo/JsonLd";

export interface BreadcrumbJsonLdItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbJsonLdItem[] }) {
  if (items.length === 0) return null;
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement,
      }}
    />
  );
}
