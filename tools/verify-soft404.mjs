// Несуществующие [id]-страницы должны отдавать ЧЕСТНЫЙ 404, а не soft-404 (404-UI
// со статусом HTTP 200). Soft-404 возникает, когда над notFound()-страницей висит
// segment loading.tsx (его Suspense-граница флашит shell со статусом 200). Этот тест
// сторожит регрессию: если кто-то снова добавит loading.tsx над [id]-маршрутом — упадёт.
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const routes = [
  "/found/zzznope404",
  "/found/zzznope404/poster",
  "/found/zzznope404/edit",
  "/lost/zzznope404",
  "/lost/zzznope404/edit",
  "/shop/product/zzznope404",
  "/adoption/zzznope404",
  "/reunited/zzznope404",
  "/community/volunteers/zzznope404",
  "/p/zzznope404",
];

for (const r of routes) {
  const s = (await fetch(`${BASE}${r}`, { redirect: "manual" })).status;
  ok(s === 404, `${r} → 404 (получено ${s})`);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
