// Чистые расчёты для дашборда «Пульс спасения» — вынесены отдельно, чтобы
// покрыть юнит-тестами без поднятия БД/сервера.

/**
 * Доля «возвращений домой» как доброжелательная метрика доверия:
 * reunions / (reunions + активные розыски), 0–100, округлённо.
 * Нет ни историй, ни активных розысков → 0 (не делим на ноль).
 */
export function rescueRate(reunions: number, activeLost: number): number {
  const denom = reunions + activeLost;
  if (denom <= 0) return 0;
  const pct = (reunions / denom) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
