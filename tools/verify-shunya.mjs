// Сторож качества Шуни (два репорта пользователя: «обрезаны или лагают»):
// 1) Все компоненты используют единый лёгкий набор /shunya/sm/* — квадратные
//    кадры с прозрачным паддингом (не «прыгают» при смене поз, не режутся
//    скруглениями, в ~15 раз легче исходников).
// 2) ShunyaLive предзагружает все позы (смена без миганий).
// 3) Компаньон не режет движущийся арт (overflow-visible, умеренный наклон).
import { readFile, readdir, stat } from "node:fs/promises";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  // sm-набор: 5 поз, квадратные (IHDR), лёгкие (<200КБ против ~1.2МБ исходных).
  const files = (await readdir("public/shunya/sm")).filter((f) => f.endsWith(".png"));
  ok(files.length === 5, `sm-набор: 5 кадров (${files.length})`);
  let allSquare = true,
    allLight = true;
  for (const f of files) {
    const buf = await readFile(`public/shunya/sm/${f}`);
    const w = buf.readUInt32BE(16),
      h = buf.readUInt32BE(20);
    if (w !== h) allSquare = false;
    if ((await stat(`public/shunya/sm/${f}`)).size > 200 * 1024) allLight = false;
  }
  ok(allSquare, "sm-кадры квадратные (смена поз не «прыгает»)");
  ok(allLight, "sm-кадры лёгкие (<200КБ)");

  const live = await readFile("src/components/brand/ShunyaLive.tsx", "utf8");
  ok(live.includes("/shunya/sm/"), "ShunyaLive использует sm-набор");
  ok(
    live.includes("Предзагрузка всех поз") && live.includes("Object.entries(SRC).map"),
    "ShunyaLive: preload всех кадров (нет мигания при смене)",
  );
  ok(
    live.includes("prev.slice(-1)"),
    "ShunyaLive: нижний слой удаляется после фейда (позы не двоятся)",
  );

  const comp = await readFile("src/components/brand/ShunyaCompanion.tsx", "utf8");
  ok(
    comp.includes("overflow-visible") && !comp.includes("overflow-hidden rounded-full"),
    "компаньон: круг не режет движущийся арт",
  );
  ok(comp.includes("rel * 12"), "компаньон: умеренный наклон (±6°)");

  // Ни один компонент не ссылается на старые тяжёлые/непрозрачные позы.
  const { execSync } = await import("node:child_process");
  let leftovers = "";
  try {
    leftovers = execSync(
      'grep -rEl "/shunya/pose-" src --include=*.tsx --include=*.ts',
      { encoding: "utf8" },
    );
  } catch {
    /* grep exit 1 = совпадений нет — это и нужно */
  }
  ok(leftovers.trim() === "", "нет ссылок на старые тяжёлые PNG в src");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
