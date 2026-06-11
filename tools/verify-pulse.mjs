// Проверка дашборда «Пульс спасения»: структура страницы + тизер на главной.
const BASE = "http://localhost:3002";
let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? "  ✓" : "  ✗ FAIL"} ${m}`); c ? pass++ : fail++; };

const res = await fetch(`${BASE}/pulse`);
const html = await res.text();
ok(res.status === 200, `/pulse → 200 (получено ${res.status})`);
ok(html.includes("Пульс спасения"), "заголовок «Пульс спасения»");
ok(html.includes("Сейчас в розыске"), "метрика «Сейчас в розыске»");
ok(html.includes("Находок ждут хозяев"), "метрика «Находок ждут хозяев»");
ok(html.includes("Уже дома"), "метрика «Уже дома»");
ok(html.includes("Наблюдений за неделю"), "метрика «Наблюдений за неделю»");
ok(/\d+%/.test(html) && html.includes("Возвращаются домой"), "блок доли возвращений (%)");
ok(html.includes("Где сейчас нужнее помощь"), "секция «Где сейчас нужнее помощь»");
ok(html.includes("Сила стаи"), "финальный блок «Сила стаи»");

const home = await (await fetch(`${BASE}/`)).text();
ok(home.includes("Стая работает прямо сейчас") && home.includes("/pulse"),
  "тизер пульса на главной ведёт на /pulse");

console.log(`\nИтог: ${pass} ✓ / ${fail} ✗`);
process.exit(fail ? 1 : 0);
