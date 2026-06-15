// Сторож FAQ-аккордеона на гайдах /guide/lost и /guide/found: нативный <details>
// (crawlable, без JS) + FAQPage JSON-LD (schema.org). Видимое и структурированное
// кормятся одним массивом. Статические страницы — БД не нужна.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const lost = await (await fetch(`${BASE}/guide/lost`)).text();
  ok(lost.includes('"@type":"FAQPage"'), "/guide/lost: FAQPage JSON-LD");
  ok(lost.includes("Частые вопросы"), "/guide/lost: заголовок FAQ");
  ok(lost.includes("<details"), "/guide/lost: нативный аккордеон <details>");
  ok(
    lost.includes("Стоит ли назначать вознаграждение"),
    "/guide/lost: вопрос про вознаграждение виден",
  );

  const found = await (await fetch(`${BASE}/guide/found`)).text();
  ok(found.includes('"@type":"FAQPage"'), "/guide/found: FAQPage JSON-LD");
  ok(
    found.includes("Частые вопросы") && found.includes("<details"),
    "/guide/found: FAQ-аккордеон",
  );
  ok(
    found.includes("настоящий хозяин"),
    "/guide/found: вопрос про проверку хозяина виден",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
