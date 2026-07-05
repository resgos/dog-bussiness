// Сторож мобильной SOS (находка дизайн-критики): паническая кнопка в шапке не
// должна прятаться за бургер-меню на мобильных. Регрессия статическая (скрытие
// было CSS-классом — в DOM элемент есть всегда, HTTP не отличит) + живой /sos.
import { readFile } from "node:fs/promises";
let pass = 0,
  fail = 0;
const ok = (c, m) => {
  console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`);
  c ? pass++ : fail++;
};

try {
  const header = await readFile("src/components/layout/Header.tsx", "utf8");
  ok(
    !/SosButton size="sm" className="hidden/.test(header),
    "шапка: SOS не скрыт на мобильных (нет hidden-класса)",
  );
  ok(
    header.includes("SOS всегда виден"),
    "шапка: намерение зафиксировано комментарием",
  );

  const res = await fetch("http://localhost:3002/sos");
  ok(res.status === 200, "/sos отвечает 200");
} catch (e) {
  ok(false, "исключение: " + e.message);
}

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
