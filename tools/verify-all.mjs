// Единый прогон всех UI/E2E-проверок против живого :3002. Запускает каждую сюиту
// отдельным процессом, наследует вывод и агрегирует результат.
//   node tools/verify-all.mjs
import { spawnSync } from "node:child_process";

const BASE = "http://localhost:3002";

// Синхронный сон без зависимостей (нужен между sync-сьютами spawnSync).
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Ждём, пока dev-сервер снова отвечает (любой ответ = жив; reject = сеть лежит).
// Транзиентный блип/перекомпиляция длится дольше одного немедленного ретрая —
// поэтому перед повтором сьюта ждём восстановления, а не бьём в мёртвое окно.
function waitForServer(timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  const probe = `fetch("${BASE}/api/me").then(()=>process.exit(0)).catch(()=>process.exit(1))`;
  while (Date.now() < deadline) {
    const r = spawnSync(process.execPath, ["-e", probe], { timeout: 5000 });
    if (r.status === 0) return true;
    sleepMs(1000);
  }
  return false;
}

const suites = [
  "e2e-flows",
  "verify-crossmatch",
  "verify-pulse",
  "verify-og",
  "verify-export",
  "verify-feedfilter",
  "verify-calendar",
  "verify-foundposter",
  "verify-sitemap",
  "verify-rss",
  "verify-foundstatus",
  "verify-lostedit",
  "verify-foundedit",
  "verify-soft404",
  "verify-sosmatch",
  "verify-districtflyer",
  "verify-reunionudge",
  "verify-foundrace",
  "verify-claim",
  "verify-foundrss",
  "verify-ratelimit",
  "verify-mapfounds",
  "verify-reviewfixes",
  "verify-checkout-variant",
  "verify-districthub",
  "verify-foundfilter",
  "verify-photoguard",
  "verify-authz",
  "verify-guestsos",
  "verify-tz-features",
  "verify-ux",
  "verify-photohash",
  "verify-wave1",
  "verify-jsonld",
  "verify-sightingdeeplink",
  "verify-search",
  "verify-nearbylost",
  "verify-feedsort",
  "verify-passportcard",
  "verify-breadcrumbs",
  "verify-nearbyfound",
  "verify-foundsort",
  "verify-faq",
  "verify-districtshare",
  "verify-messengershare",
  "verify-skiplink",
  "verify-districtog",
  "verify-homeog",
  "verify-motionpolish",
  "verify-focuspolish",
  "verify-formux",
  "verify-anchorchip",
  "verify-typorss",
  "verify-typocanon",
  "verify-nearbydistrict",
  "verify-headera11y",
  "verify-imgperf",
  "verify-boostbridge",
  "verify-p0bridges",
  "verify-rewarddonate",
];

// Шаг 0: смести сирот от прерванных прошлых прогонов (демо-лента должна быть
// чистой даже после Ctrl+C посреди сьюта). Не валит прогон — только докладывает.
{
  process.stdout.write("━━━━ verify-sweep (предочистка) ━━━━\n");
  spawnSync(process.execPath, ["tools/verify-sweep.mjs"], { stdio: "inherit" });
}

let failed = 0;
const summary = [];
for (const s of suites) {
  process.stdout.write(`\n━━━━ ${s} ━━━━\n`);
  let r = spawnSync(process.execPath, [`tools/${s}.mjs`], { stdio: "inherit" });
  if (r.status !== 0) {
    // Транзиентный блип dev-сервера (fetch failed/ECONNREFUSED на смежном блоке)
    // длится дольше немедленного ретрая → сперва ДОЖИДАЕМСЯ готовности сервера,
    // потом повторяем. Настоящий провал воспроизводится и после восстановления.
    process.stdout.write(`\n  ↻ ретрай ${s}: жду готовности сервера…\n`);
    waitForServer();
    sleepMs(1500);
    r = spawnSync(process.execPath, [`tools/${s}.mjs`], { stdio: "inherit" });
  }
  const okRun = r.status === 0;
  if (!okRun) failed++;
  summary.push(`${okRun ? "✓" : "✗"} ${s}`);
}

console.log(`\n${"═".repeat(50)}`);
console.log(summary.join("\n"));
console.log(`\nСюит: ${suites.length} · провалено: ${failed}`);
process.exit(failed ? 1 : 0);
