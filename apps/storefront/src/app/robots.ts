import type { MetadataRoute } from "next";
import { getStorefrontSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getStorefrontSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/login",
        "/*/register",
        "/*/cart",
        "/*/checkout",
        "/*/wishlist",
        "/*/search",
        "/*/account",
        "/*/order-confirmation",
        "/*/auth/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
