// Единый прогон всех UI/E2E-проверок против живого :3002. Запускает каждую сюиту
// отдельным процессом, наследует вывод и агрегирует результат.
//   node tools/verify-all.mjs
import { spawnSync } from "node:child_process";

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
];

let failed = 0;
const summary = [];
for (const s of suites) {
  process.stdout.write(`\n━━━━ ${s} ━━━━\n`);
  const r = spawnSync(process.execPath, [`tools/${s}.mjs`], { stdio: "inherit" });
  const okRun = r.status === 0;
  if (!okRun) failed++;
  summary.push(`${okRun ? "✓" : "✗"} ${s}`);
}

console.log(`\n${"═".repeat(50)}`);
console.log(summary.join("\n"));
console.log(`\nСюит: ${suites.length} · провалено: ${failed}`);
process.exit(failed ? 1 : 0);
