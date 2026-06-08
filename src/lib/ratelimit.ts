// Простой in-memory лимитер запросов (на один инстанс приложения).
// Для прод-масштаба на несколько инстансов заменить на Redis/Upstash.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Чистим протухшие ключи, чтобы Map не рос бесконечно (не чаще раза в минуту). */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now > b.reset) buckets.delete(k);
  }
}

/** true — запрос разрешён; false — лимит превышен. */
export function rateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

/** Ключ из IP запроса (учитывая прокси) + название действия. */
export function ipKey(req: Request, action: string): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip =
    fwd.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${action}:${ip}`;
}
