// Проверка динамических OG-карточек для /lost/[id] и /found/[id]:
// мета-теги на странице + сам рендер картинки (200 image/png, непустая).
// Дополнительно сохраняет PNG в tools/_og-*.png для визуальной проверки глифов.
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";
const db = new PrismaClient();
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

async function checkOg(label, pageUrl, outFile) {
  const html = await (await fetch(`${BASE}${pageUrl}`)).text();
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  ok(!!m, `${label}: <meta og:image> присутствует на странице`);
  ok(/name="twitter:card" content="summary_large_image"/.test(html),
    `${label}: twitter:card = summary_large_image`);
  if (m) {
    const url = m[1].startsWith("http")
      ? m[1].replace(/&amp;/g, "&")
      : `${BASE}${m[1].replace(/&amp;/g, "&")}`;
    const res = await fetch(url);
    const ct = res.headers.get("content-type") || "";
    const buf = Buffer.from(await res.arrayBuffer());
    ok(res.status === 200 && ct.includes("image/png"),
      `${label}: og:image → 200 ${ct}`);
    ok(buf.length > 5000, `${label}: картинка непустая (${buf.length} байт)`);
    await writeFile(outFile, buf);
    console.log(`    ↳ сохранено: ${outFile}`);
  }
}

const lost = await db.lostReport.findFirst({ where: { status: "active" }, select: { id: true } });
const found = await db.foundReport.findFirst({ where: { status: "open" }, select: { id: true } });

if (lost) await checkOg("lost", `/lost/${lost.id}`, "tools/_og-lost.png");
else console.log("  ⚠ нет активной пропажи для проверки");
if (found) await checkOg("found", `/found/${found.id}`, "tools/_og-found.png");
else console.log("  ⚠ нет открытой находки для проверки");

await db.$disconnect();
console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
