// Лимитер запросов с переключаемым стором:
//   • in-memory — self-hosted на одном инстансе (по умолчанию, без зависимостей);
//   • Redis     — общий стор при нескольких инстансах / переезде на КТС
//                 (активируется заданием REDIS_URL; сам Redis — в docker-compose).
// При недоступности Redis — мягкий фолбэк на in-memory (запросы не блокируются).
import Redis from "ioredis";

// ——— in-memory ———
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
}

function memLimit(key: string, max: number, windowMs: number): boolean {
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

// ——— Redis (ленивая инициализация) ———
let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return null;
  }
  try {
    const client = new Redis(url, {
      // Буферизуем команды до установления соединения (иначе первые запросы
      // после старта гоняются с коннектом и уходят в in-memory фолбэк).
      enableOfflineQueue: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 1000,
    });
    client.on("error", () => {}); // не падаем на сбоях соединения
    redis = client;
  } catch {
    redis = null;
  }
  return redis;
}

// Лимит — это продакшен-защита от спама. В dev/тестах все запросы идут с одного
// localhost-IP, поэтому лимит лишь флакает E2E (стэкнутые прогоны verify-all) и
// может сработать на живом демо. Поэтому вне production он по умолчанию выключен.
// Принудительно проверить лимит локально: RATELIMIT_FORCE=1.
const RL_ENABLED =
  process.env.NODE_ENV === "production" || process.env.RATELIMIT_FORCE === "1";

/** true — запрос разрешён; false — лимит превышен. Окно фиксированное. */
export async function rateLimit(
  key: string,
  max = 5,
  windowMs = 60_000,
): Promise<boolean> {
  if (!RL_ENABLED) return true;
  const r = getRedis();
  if (r) {
    try {
      const k = `rl:${key}`;
      const count = await r.incr(k);
      if (count === 1) await r.pexpire(k, windowMs);
      return count <= max;
    } catch {
      return memLimit(key, max, windowMs); // Redis недоступен — фолбэк
    }
  }
  return memLimit(key, max, windowMs);
}

/** Ключ из IP запроса (учитывая прокси) + название действия. */
export function ipKey(req: Request, action: string): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip =
    fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  return `${action}:${ip}`;
}
