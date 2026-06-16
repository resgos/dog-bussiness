// Сторож: (1) дизайн — text-wrap:pretty на абзацах в собранном CSS; (2) фича —
// canonical на лентах: фильтр-варианты ?district= консолидируются на базовый URL.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const home = await (await fetch(`${BASE}/`)).text();
  const cssHref = (home.match(/href="([^"]+\.css[^"]*)"/) || [])[1];
  const css = cssHref ? await (await fetch(`${BASE}${cssHref}`)).text() : "";
  ok(
    css.includes("text-wrap") && css.includes("pretty"),
    "CSS: text-wrap:pretty на абзацах",
  );

  const CANON_LOST = '"https://lapka-pomoshchi.ru/feed/lost"';
  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(
    feed.includes('rel="canonical"') && feed.includes(CANON_LOST),
    "/feed/lost: canonical базового URL",
  );

  const filtered = await (
    await fetch(`${BASE}/feed/lost?district=khamovniki`)
  ).text();
  ok(
    filtered.includes(CANON_LOST),
    "?district=… → canonical всё ещё базовый URL (без дубль-контента)",
  );

  const found = await (await fetch(`${BASE}/found`)).text();
  ok(
    found.includes('rel="canonical"') &&
      found.includes('"https://lapka-pomoshchi.ru/found"'),
    "/found: canonical базового URL",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
