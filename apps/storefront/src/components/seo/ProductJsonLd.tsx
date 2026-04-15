import { JsonLd } from "@/components/seo/JsonLd";

export interface ProductJsonLdProps {
  name: string;
  description: string;
  images: string[];
  brandName?: string;
  sku: string;
  productUrl: string;
  price: number;
  priceCurrency: string;
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
}

export function ProductJsonLd(props: ProductJsonLdProps) {
  const {
    name,
    description,
    images,
    brandName,
    sku,
    productUrl,
    price,
    priceCurrency,
    availability,
  } = props;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || undefined,
    sku,
    url: productUrl,
    image: images.length ? images : undefined,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency,
      price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return <JsonLd data={data} />;
}
