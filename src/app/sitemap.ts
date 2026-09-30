import type { MetadataRoute } from "next";
import { siteUrl } from "@/features/public/seo";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrl ? [{ url: `${siteUrl}/` }] : [];
}
