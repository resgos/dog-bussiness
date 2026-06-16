// Сторож динамической OG-карточки хаба района: метаданные ссылаются на
// opengraph-image, сама карточка отдаётся валидным PNG (magic bytes), неизвестный
// район деградирует в карточку-фолбэк (не 500).
const BASE = "http://localhost:3002";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  // Метаданные хаба ссылаются на OG-карточку (Next file-convention auto-inject).
  const html = await (await fetch(`${BASE}/district/khamovniki`)).text();
  ok(
    html.includes("og:image") &&
      html.includes("/district/khamovniki/opengraph-image"),
    "хаб: og:image → opengraph-image",
  );

  // Сама карточка — валидный PNG 200.
  const res = await fetch(`${BASE}/district/khamovniki/opengraph-image`);
  const buf = Buffer.from(await res.arrayBuffer());
  ok(res.status === 200, "OG-карточка → 200");
  ok(
    (res.headers.get("content-type") || "").includes("image/png"),
    "content-type image/png",
  );
  ok(
    buf.length > 1000 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
    "валидный PNG (magic bytes + размер)",
  );

  // Неизвестный район → карточка-фолбэк («Москва»), не падение.
  const r2 = await fetch(`${BASE}/district/zzznetrayona/opengraph-image`);
  ok(r2.status === 200, "неизвестный район → карточка-фолбэк 200");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
