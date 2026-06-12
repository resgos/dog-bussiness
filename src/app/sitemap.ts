import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { districts } from "@/lib/districts";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

// Карта сайта пересобирается динамически: разыскиваемые питомцы должны попадать
// в индекс Google как можно быстрее — это бесплатный канал поиска.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "", "/map", "/feed/lost", "/feed/found", "/found", "/community",
    "/community/volunteers", "/shop", "/adoption", "/reunited", "/guide",
    "/guide/lost", "/guide/found", "/chip", "/about", "/partners", "/blog",
    "/privacy", "/offer", "/pulse",
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

  // Объявления о пропаже/находке (в т.ч. без аккаунта-питомца) — в индекс:
  // органический поиск приводит тех, кто ищет или нашёл собаку. Активные пропажи —
  // наивысший приоритет и hourly, как самый «горящий» контент.
  const losts = await db.lostReport
    .findMany({
      where: { status: "active" },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    })
    .catch(() => []);
  const lostRoutes: MetadataRoute.Sitemap = losts.map((r) => ({
    url: `${BASE}/lost/${r.id}`,
    lastModified: r.createdAt,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  const founds = await db.foundReport
    .findMany({
      where: { status: "open" },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    })
    .catch(() => []);
  const foundRoutes: MetadataRoute.Sitemap = founds.map((r) => ({
    url: `${BASE}/found/${r.id}`,
    lastModified: r.createdAt,
    changeFrequency: "hourly" as const,
    priority: 0.7,
  }));

  const products = await db.product
    .findMany({ select: { slug: true } })
    .catch(() => []);
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/shop/product/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  // Хабы районов — постоянные посадочные страницы под локальный поиск
  // («потерялась собака <район> Москва»). Их немного (24), все известны заранее.
  const districtRoutes: MetadataRoute.Sitemap = districts.map((d) => ({
    url: `${BASE}/district/${d.id}`,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...districtRoutes,
    ...petRoutes,
    ...lostRoutes,
    ...foundRoutes,
    ...productRoutes,
  ];
}
