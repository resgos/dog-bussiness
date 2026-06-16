// Сторож корневой сайтовой OG-карточки: главная и страницы без собственной OG
// (наследуют корневую app/opengraph-image) ссылаются на неё; карточка — валидный
// PNG. Детальные страницы по-прежнему используют СВОЮ карточку (см. verify-og).
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
    home.includes("og:image") && home.includes("/opengraph-image"),
    "главная: og:image → корневая OG-карточка",
  );

  const res = await fetch(`${BASE}/opengraph-image`);
  const buf = Buffer.from(await res.arrayBuffer());
  ok(res.status === 200, "OG-карточка → 200");
  ok(
    buf.length > 1000 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
    "валидный PNG (magic bytes + размер)",
  );

  // Страница без своей OG (гайд) наследует корневую карточку.
  const guide = await (await fetch(`${BASE}/guide/lost`)).text();
  ok(
    guide.includes("/opengraph-image"),
    "страница без своей OG наследует корневую карточку",
  );
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
