// Сторож motion-полировки: (1) глобальный @media prefers-reduced-motion в
// собранном CSS глушит анимации/переходы; (2) кнопка «Наверх» присутствует в
// общем layout на всех страницах. Поведение скролла — живой preview.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const html = await (await fetch(`${BASE}/`)).text();

  // Дизайн: глобальный prefers-reduced-motion в собранном CSS.
  const cssHref = (html.match(/href="([^"]+\.css[^"]*)"/) || [])[1];
  const css = cssHref ? await (await fetch(`${BASE}${cssHref}`)).text() : "";
  ok(css.includes("prefers-reduced-motion"), "CSS: media prefers-reduced-motion");
  ok(
    css.includes("animation-duration") && css.includes("transition-duration"),
    "CSS: глобальное глушение анимаций и переходов",
  );

  // Фича: кнопка «Наверх» в общем layout (присутствует на всех страницах).
  ok(html.includes('aria-label="Наверх"'), "главная: кнопка «Наверх»");
  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(feed.includes('aria-label="Наверх"'), "лента: кнопка «Наверх» (layout-wide)");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
