// Сторож JSON-LD структурированных данных на /lost/[id] и /found/[id]:
// schema.org Article (богатые результаты Google), картинка — реальный URL
// OG-карточки, район как contentLocation, + canonical в <head>.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

// Достаём содержимое первого <script type="application/ld+json"> и парсим.
// `<` в значениях экранирован в < — JSON.parse это понимает нативно.
const extractLd = (html) => {
  const m = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
};

const stamp = Date.now();
const cleanup = { losts: [], founds: [] };

try {
  // — /lost/[id] —
  const lost = await db.lostReport.create({
    data: { petName: `LdПёс-${stamp}`, breed: "корги", district: "tverskoy", status: "active" },
  });
  cleanup.losts.push(lost.id);
  const lh = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
  const lld = extractLd(lh);
  ok(Boolean(lld), "/lost/[id]: JSON-LD присутствует и парсится");
  ok(lld?.["@type"] === "Article", `/lost: @type = Article (${lld?.["@type"]})`);
  ok(
    typeof lld?.headline === "string" && lld.headline.includes(lost.petName),
    "/lost: headline с кличкой",
  );
  ok(
    Array.isArray(lld?.image) &&
      lld.image[0].includes(`/lost/${lost.id}/opengraph-image`) &&
      lld.image[0].startsWith("http"),
    "/lost: image = абсолютный URL OG-карточки",
  );
  ok(
    typeof lld?.url === "string" && lld.url.includes(`/lost/${lost.id}`) && lld.url.startsWith("http"),
    "/lost: url абсолютный",
  );
  ok(
    lld?.contentLocation?.name?.includes("Тверской"),
    "/lost: contentLocation — район",
  );
  ok(
    typeof lld?.datePublished === "string" && lld.datePublished.includes("T"),
    "/lost: datePublished ISO",
  );
  ok(lh.includes('rel="canonical"'), "/lost: canonical в <head>");

  // — /found/[id] —
  const found = await db.foundReport.create({
    data: { breed: `LdНаходка-${stamp}`, color: "рыжая", district: "tverskoy", status: "open" },
  });
  cleanup.founds.push(found.id);
  const fh = await (await fetch(`${BASE}/found/${found.id}`)).text();
  const fld = extractLd(fh);
  ok(Boolean(fld) && fld["@type"] === "Article", "/found/[id]: JSON-LD Article присутствует");
  ok(
    fld?.image?.[0]?.includes(`/found/${found.id}/opengraph-image`),
    "/found: image = OG-карточка",
  );
  ok(fh.includes('rel="canonical"'), "/found: canonical в <head>");
} finally {
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
