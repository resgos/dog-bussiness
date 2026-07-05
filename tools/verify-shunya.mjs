// Сторож фикса Шуни-компаньона (репорт: «обрезаны или лагают»):
// (1) ShunyaLive предзагружает все позы (тяжёлые PNG ~1 МБ мигали при смене);
// (2) круглая кнопка компаньона не режет движущийся арт (overflow-visible,
//     умеренный наклон). Клиентские анимации по HTTP не видны — фиксируем
//     исходники (паттерн статической регрессии).
import { readFile } from "node:fs/promises";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const live = await readFile("src/components/brand/ShunyaLive.tsx", "utf8");
  ok(
    live.includes("Предзагрузка всех поз"),
    "ShunyaLive: preload-слой всех поз (нет мигания при смене)",
  );
  ok(
    live.includes("Object.entries(SRC).map"),
    "ShunyaLive: предзагружаются все кадры из SRC",
  );

  const comp = await readFile("src/components/brand/ShunyaCompanion.tsx", "utf8");
  ok(
    comp.includes("overflow-visible") && !comp.includes("overflow-hidden rounded-full"),
    "компаньон: круг не режет движущийся арт (overflow-visible)",
  );
  ok(comp.includes("rel * 12"), "компаньон: умеренный наклон (±6°)");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
