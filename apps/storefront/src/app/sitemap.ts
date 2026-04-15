import type { MetadataRoute } from "next";
import { buildStorefrontSitemap } from "@/lib/sitemap-build";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildStorefrontSitemap();
}
