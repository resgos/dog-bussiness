// Сторож: (1) единый брендовый :focus-visible outline в собранном CSS; (2) форма
// поиска на кастомной странице 404 (тупик → точка входа). 404 рендерится на
// любом несуществующем пути.
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
    css.includes(":focus-visible") && css.includes("outline-offset"),
    "CSS: единый :focus-visible outline",
  );
  ok(
    css.includes("var(--color-petal-deep)") || css.includes("petal-deep"),
    "CSS: фокус брендового цвета (petal-deep)",
  );

  // Поиск на 404.
  const res = await fetch(`${BASE}/zzz-net-takoy-stranicy-${Date.now()}`);
  const html = await res.text();
  ok(res.status === 404, "несуществующий путь → 404");
  ok(
    html.includes('action="/search"') && html.includes('name="q"'),
    "404: форма поиска (action=/search)",
  );
  ok(html.includes("тропинка потерялась"), "404: брендовая страница");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
