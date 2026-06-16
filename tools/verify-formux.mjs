// Сторож формовой полировки: (1) дизайн — поля ввода используют читаемый
// плейсхолдер /80; (2) фича — поисковые инпуты type="search" (нативная очистка
// ✕ + поисковая клавиатура) на /search, /feed/lost и /found.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const search = await (await fetch(`${BASE}/search`)).text();
  ok(
    search.includes('name="q"') && search.includes('type="search"'),
    "/search: инпут q — type=search",
  );
  ok(
    search.includes("placeholder:text-ink-soft/80"),
    "поле ввода: читаемый плейсхолдер /80",
  );

  const feed = await (await fetch(`${BASE}/feed/lost`)).text();
  ok(feed.includes('type="search"'), "/feed/lost: поиск ленты — type=search");

  const found = await (await fetch(`${BASE}/found`)).text();
  ok(found.includes('type="search"'), "/found: поиск находок — type=search");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
