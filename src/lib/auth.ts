import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db";

export const SESSION_COOKIE = "lapka_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

/** Хэш пароля на scrypt (формат "salt:hash"), без внешних зависимостей. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const calc = scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}

/** Создаёт сессию в БД и возвращает токен. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

/** Ставит cookie сессии. Вызывать только в Server Action / Route Handler. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Завершает сессию: удаляет cookie и (если есть) запись в БД. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

/** Текущий пользователь по cookie сессии (или null). Безопасно в server-компонентах. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}
