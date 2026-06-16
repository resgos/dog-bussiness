// Сторож кнопки «Поделиться районом» на хабе /district/[id]: ShareButton с
// контекстным aria-label и текстом-сводкой (N в розыске, M находок). Хаб
// khamovniki заведомо существует; неизвестный район → 404.
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const res = await fetch(`${BASE}/district/khamovniki`);
  const html = await res.text();
  ok(res.status === 200, "GET /district/khamovniki → 200");
  ok(
    html.includes('aria-label="Поделиться районом"'),
    "кнопка «Поделиться районом» (контекстный aria-label)",
  );
  ok(html.includes("Поделиться"), "видимый текст «Поделиться»");
  ok(html.includes("ждут хозяев"), "текст-сводка для шеринга");

  const r404 = await fetch(`${BASE}/district/zzznetrayona`);
  ok(r404.status === 404, "неизвестный район → 404");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
