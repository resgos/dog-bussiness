// Сторож: (1) дизайн — text-wrap:balance на заголовках в собранном CSS;
// (2) фича — RSS auto-discovery (link rel="alternate" application/rss+xml) на
// лентах /feed/lost и /found.
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
    css.includes("text-wrap") && css.includes("balance"),
    "CSS: text-wrap:balance на заголовках",
  );

  const feedLost = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(
    feedLost.includes('rel="alternate"') &&
      feedLost.includes("application/rss+xml") &&
      feedLost.includes("/feed/lost/rss"),
    "/feed/lost: rel=alternate RSS (авто-обнаружение)",
  );

  const found = await (await fetch(`${BASE}/found`)).text();
  ok(
    found.includes("application/rss+xml") && found.includes("/feed/found/rss"),
    "/found: rel=alternate RSS",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
