// Сторож шапки: (1) дизайн — тап-таргет иконки поиска size-11 (44px); (2) a11y —
// aria-current="page" на активной навигации (скринридер объявляет текущую
// страницу). На /about активен «О проекте», на /feed/lost — «Лента» + «Потерялись».
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const home = await (await fetch(`${BASE}/`)).text();
  ok(
    home.includes('aria-label="Поиск по объявлениям"') &&
      home.includes("size-11"),
    "шапка: иконка поиска с тап-таргетом size-11",
  );

  const about = await (await fetch(`${BASE}/about`)).text();
  ok(
    about.includes('aria-current="page"'),
    "/about: aria-current=page на активной навигации",
  );

  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(
    feed.includes('aria-current="page"'),
    "/feed/lost: aria-current=page на активной навигации",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
