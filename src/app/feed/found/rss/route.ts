import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Лента всегда свежая (новые находки должны появляться у подписчиков сразу).
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

// Удаляет символы, недопустимые в XML 1.0 (всё < 0x20, кроме \t \n \r). Один
// такой символ в пользовательском поле сломал бы парсинг ленты у всех подписчиков.
function stripCtl(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) continue;
    out += ch;
  }
  return out;
}

function esc(s: string): string {
  return stripCtl(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// RSS 2.0-лента открытых находок: приюты, зоозащитники и агрегаторы могут
// подписаться и быстрее свести найденную собаку с хозяином (симметрия к /feed/lost/rss).
export async function GET() {
  const reports = await db.foundReport
    .findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" }, take: 200 })
    .catch(() => []);

  const items = reports.map((r) => {
    const districtName = r.district ? findDistrict(r.district)?.name ?? null : null;
    const facts = [r.breed, r.color, districtName].filter(Boolean).join(" · ");
    const title = `🔎 Найдена собака${facts ? ` · ${facts}` : ""}`;
    const descParts = [
      r.breed ? `Порода: ${r.breed}` : null,
      r.color ? `Окрас: ${r.color}` : null,
      districtName ? `Район: ${districtName}` : null,
      r.comment || null,
    ].filter((v): v is string => Boolean(v));
    const link = `${SITE}/found/${r.id}`;
    const pub = new Date(r.createdAt);
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
    "    <title>Лапка помощи — найденные собаки</title>",
    `    <link>${esc(SITE)}/feed/found</link>`,
    "    <description>Открытые объявления о найденных собаках — Москва</description>",
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
