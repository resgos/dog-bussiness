import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

// Карта сайта пересобирается динамически: разыскиваемые питомцы должны попадать
// в индекс Google как можно быстрее — это бесплатный канал поиска.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "", "/map", "/feed/lost", "/feed/found", "/found", "/community",
    "/community/volunteers", "/shop", "/adoption", "/reunited", "/guide",
    "/guide/lost", "/guide/found", "/chip", "/about", "/partners", "/blog",
    "/privacy", "/offer",
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  // Публичные паспорта: разыскиваемые — высокий приоритет.
  const pets = await db.pet
    .findMany({
      where: { status: { in: ["lost", "found"] } },
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    })
    .catch(() => []);
  const petRoutes: MetadataRoute.Sitemap = pets.map((p) => ({
    url: `${BASE}/p/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "hourly" as const,
    priority: p.status === "lost" ? 0.9 : 0.5,
  }));

  const products = await db.product
    .findMany({ select: { slug: true } })
    .catch(() => []);
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/shop/product/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...petRoutes, ...productRoutes];
}
