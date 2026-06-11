import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Лента всегда свежая (новые пропажи должны появляться у подписчиков сразу).
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// RSS 2.0-лента активных пропаж: районные Telegram-каналы и агрегаторы могут
// подписаться и авто-репостить новые SOS — бесплатный канал распространения.
export async function GET() {
  const reports = await db.lostReport
    .findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 200 })
    .catch(() => []);

  const items = reports.map((r) => {
    const districtName = r.district ? findDistrict(r.district)?.name ?? null : null;
    const title = `🆘 ${[r.petName, r.breed, districtName].filter(Boolean).join(" · ")}`;
    const descParts = [
      r.breed ? `Порода: ${r.breed}` : null,
      districtName ? `Район: ${districtName}` : null,
      r.comment || null,
      r.reward ? `Награда: ${r.reward.toLocaleString("ru-RU")} ₽` : null,
    ].filter((v): v is string => Boolean(v));
    const link = `${SITE}/lost/${r.id}`;
    const pub = new Date(r.lostAt ?? r.createdAt);
    return [
      "    <item>",
      `      <title>${esc(title)}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid isPermaLink="true">${esc(link)}</guid>`,
      `      <pubDate>${pub.toUTCString()}</pubDate>`,
      `      <description>${esc(descParts.join(". "))}</description>`,
      "    </item>",
    ].join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>Лапка помощи — потерянные собаки</title>",
    `    <link>${esc(SITE)}/feed/lost</link>`,
    "    <description>Активные объявления о пропаже собак — Москва</description>",
    "    <language>ru</language>",
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
