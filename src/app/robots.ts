import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Личный кабинет, API и админка — не для индексации.
      disallow: ["/profile", "/api/", "/admin"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
