// Сторож скип-ссылки (WCAG 2.4.1): в общем layout есть href="#main" (скрытая
// sr-only, видимая при фокусе) и цель <main id="main">. Присутствует на всех
// страницах, т.к. в корневом layout.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const home = await (await fetch(`${BASE}/`)).text();
  ok(home.includes('href="#main"'), "скип-ссылка href=\"#main\"");
  ok(home.includes("Перейти к содержимому"), "текст скип-ссылки");
  ok(home.includes('id="main"'), "цель <main id=\"main\">");
  ok(home.includes("sr-only"), "скип-ссылка скрыта по умолчанию (sr-only)");

  // Layout общий — ссылка должна быть и на детальной странице.
  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(
    feed.includes('href="#main"') && feed.includes('id="main"'),
    "скип-ссылка и цель на всех страницах (общий layout)",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
