// Сторож: (1) дизайн — color-scheme:light + accent-color в собранном CSS;
// (2) фича — «Районы рядом» (тот же округ) на хабе района; одинокий район округа
// (ЮАО = только Даниловский) секцию не показывает.
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
  ok(css.includes("color-scheme"), "CSS: color-scheme:light");
  ok(css.includes("accent-color"), "CSS: accent-color брендовый");

  const kham = await (await fetch(`${BASE}/district/khamovniki`)).text();
  ok(kham.includes("Районы рядом"), "хаб: секция «Районы рядом»");
  ok(
    kham.includes("/district/arbat") && kham.includes("/district/tverskoy"),
    "ссылки на соседей того же округа (ЦАО)",
  );

  // ЮАО в датасете — только Даниловский → соседей нет, секции нет.
  const dani = await (await fetch(`${BASE}/district/danilovsky`)).text();
  ok(!dani.includes("Районы рядом"), "одинокий район округа → секции нет");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
