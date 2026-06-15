// Сторож JSON-LD на публичных страницах /lost/[id], /found/[id], /p/[id]:
// schema.org Article (богатые результаты) + BreadcrumbList (хлебные крошки),
// картинка — реальный URL OG-карточки, район как contentLocation, canonical в head.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

// Все <script type="application/ld+json"> на странице → массив распарсенных
// объектов. `<` в значениях экранирован в <, что JSON.parse понимает нативно.
const extractAll = (html) => {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      /* битый блок — пропускаем */
    }
  }
  return out;
};
const ofType = (blocks, t) => blocks.find((b) => b["@type"] === t);

const stamp = Date.now();
const cleanup = { losts: [], founds: [], pets: [] };

try {
  // — / (главная): корень structured data — Organization + WebSite —
  const home = extractAll(await (await fetch(`${BASE}/`)).text());
  const org = ofType(home, "Organization");
  ok(Boolean(org), "/: Organization-блок присутствует");
  ok(org?.logo?.startsWith("http"), "/: Organization.logo — абсолютный URL");
  ok(Boolean(ofType(home, "WebSite")), "/: WebSite-блок присутствует");

  // — /lost/[id] —
  const lost = await db.lostReport.create({
    data: { petName: `LdПёс-${stamp}`, breed: "корги", district: "tverskoy", status: "active" },
  });
  cleanup.losts.push(lost.id);
  const lh = await (await fetch(`${BASE}/lost/${lost.id}`)).text();
  const lb = extractAll(lh);
  const lArt = ofType(lb, "Article");
  const lCrumb = ofType(lb, "BreadcrumbList");
  ok(Boolean(lArt), "/lost: Article-блок присутствует");
  ok(lArt?.headline?.includes(lost.petName), "/lost: headline с кличкой");
  ok(
    lArt?.image?.[0]?.includes(`/lost/${lost.id}/opengraph-image`) && lArt.image[0].startsWith("http"),
    "/lost: image = абсолютный URL OG-карточки",
  );
  ok(lArt?.contentLocation?.name?.includes("Тверской"), "/lost: contentLocation район");
  ok(Boolean(lCrumb), "/lost: BreadcrumbList присутствует");
  ok(
    lCrumb?.itemListElement?.length === 3 &&
      lCrumb.itemListElement[2].name === lost.petName,
    "/lost: крошки Главная → Лента → кличка",
  );
  ok(lh.includes('rel="canonical"'), "/lost: canonical в head");

  // — /found/[id] —
  const found = await db.foundReport.create({
    data: { breed: `LdНаходка-${stamp}`, color: "рыжая", district: "tverskoy", status: "open" },
  });
  cleanup.founds.push(found.id);
  const fb = extractAll(await (await fetch(`${BASE}/found/${found.id}`)).text());
  ok(Boolean(ofType(fb, "Article")), "/found: Article-блок присутствует");
  ok(
    ofType(fb, "Article")?.image?.[0]?.includes(`/found/${found.id}/opengraph-image`),
    "/found: image = OG-карточка",
  );
  ok(Boolean(ofType(fb, "BreadcrumbList")), "/found: BreadcrumbList присутствует");

  // — /p/[id] паспорт (третий публичный тип контента) —
  const pet = await db.pet.create({
    data: { name: `LdПаспорт-${stamp}`, breed: "корги", district: "tverskoy", status: "lost" },
  });
  cleanup.pets.push(pet.id);
  const ph = await (await fetch(`${BASE}/p/${pet.id}`)).text();
  const pb = extractAll(ph);
  const pArt = ofType(pb, "Article");
  ok(Boolean(pArt), "/p/[id]: Article-блок присутствует");
  ok(pArt?.headline?.includes(pet.name), "/p: headline с кличкой");
  ok(
    pArt?.image?.[0]?.includes(`/p/${pet.id}/opengraph-image`) && pArt.image[0].startsWith("http"),
    "/p: image = абсолютный URL OG-карточки",
  );
  ok(Boolean(ofType(pb, "BreadcrumbList")), "/p: BreadcrumbList присутствует");
  ok(ph.includes('rel="canonical"'), "/p: canonical в head");
} finally {
  for (const id of cleanup.losts)
    await db.lostReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.founds)
    await db.foundReport.delete({ where: { id } }).catch(() => {});
  for (const id of cleanup.pets)
    await db.pet.delete({ where: { id } }).catch(() => {});
  await db.$disconnect();
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
