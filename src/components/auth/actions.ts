"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { findDistrict } from "@/lib/districts";
import { digits, isEmailValid } from "@/lib/onboarding";
import { sendVerificationEmail } from "@/lib/verify";
import { randomBytes } from "node:crypto";

/**
 * Результат Server Action: либо ошибка (показываем человеку), либо редирект,
 * либо признак успешного сохранения (для форм без редиректа — настройки).
 */
export type AuthState = { error?: string; saved?: boolean };

const MIN_PASSWORD = 6;

/** Нормализуем телефон к виду +7XXXXXXXXXX (РФ), чтобы вход и регистрация совпадали. */
function normalizePhone(raw: string): string {
  let d = digits(raw);
  // 11 цифр с ведущей «8» (8XXXXXXXXXX) → 7XXXXXXXXXX
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  // 11 цифр с ведущей «7» (7XXXXXXXXXX) — уже в нужном виде, оставляем как есть
  // 10 цифр без кода страны → добавим 7
  if (d.length === 10) d = "7" + d;
  return "+" + d;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeTelegram(raw: string): string | null {
  const t = raw.trim().replace(/^@+/, "");
  return t ? "@" + t : null;
}

/**
 * Регистрация нового участника стаи (ТЗ 4.1).
 * Поля формы: name, mode (phone|email), phone|email, password, district, telegram?.
 */
export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const mode = String(formData.get("mode") ?? "phone") === "email" ? "email" : "phone";
  const password = String(formData.get("password") ?? "");
  const districtId = String(formData.get("district") ?? "").trim();
  const telegram = normalizeTelegram(String(formData.get("telegram") ?? ""));

  if (!name) return { error: "Как же тебя зовут? Без имени в стаю не пустим 🐾" };
  if (password.trim().length < MIN_PASSWORD)
    return { error: `Пароль коротковат — нужно минимум ${MIN_PASSWORD} символов.` };
  if (!districtId || !findDistrict(districtId))
    return { error: "Выбери свой район — так я пойму, кого звать на помощь." };

  let phone: string | null = null;
  let email: string | null = null;

  if (mode === "phone") {
    const raw = String(formData.get("phone") ?? "");
    if (digits(raw).length < 10)
      return { error: "Проверь номер телефона — кажется, в нём не хватает цифр." };
    phone = normalizePhone(raw);
  } else {
    const raw = String(formData.get("email") ?? "");
    if (!isEmailValid(raw))
      return { error: "Это не похоже на email. Попробуй ещё раз." };
    email = normalizeEmail(raw);
  }

  // Уже занято?
  const existing = await db.user.findFirst({
    where: phone ? { phone } : { email: email! },
  });
  if (existing) {
    return {
      error:
        mode === "phone"
          ? "Этот телефон уже в стае. Попробуй войти."
          : "Этот email уже зарегистрирован. Попробуй войти.",
    };
  }

  // Рефералка: код приглашения для нового участника + привязка к пригласившему.
  const refCode = String(formData.get("ref") ?? "").trim();
  const referrer = refCode
    ? await db.user.findUnique({ where: { referralCode: refCode } })
    : null;
  const myReferralCode = randomBytes(5).toString("hex");

  let user;
  try {
    user = await db.user.create({
      data: {
        name: name.slice(0, 80),
        phone,
        email,
        passwordHash: hashPassword(password),
        district: districtId,
        telegram,
        referralCode: myReferralCode,
        referredById: referrer?.id ?? null,
      },
    });
  } catch (e: unknown) {
    // Гонка/дубликат по @unique (phone/email) — findFirst выше мог не успеть.
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Этот телефон или email уже в стае — попробуй войти." };
    }
    throw e;
  }

  // Письмо-подтверждение e-mail (мягкая верификация — вход не блокирует).
  if (user.email) await sendVerificationEmail(user.id, user.email);

  const token = await createSession(user.id);
  await setSessionCookie(token);
  redirect("/profile");
}

/**
 * Вход по телефону/email + паролю (ТЗ 4.1).
 * Поля формы: mode (phone|email), phone|email, password.
 */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "phone") === "email" ? "email" : "phone";
  const password = String(formData.get("password") ?? "");

  let where: { phone: string } | { email: string };
  if (mode === "phone") {
    const raw = String(formData.get("phone") ?? "");
    if (digits(raw).length < 10)
      return { error: "Введи номер телефона целиком." };
    where = { phone: normalizePhone(raw) };
  } else {
    const raw = String(formData.get("email") ?? "");
    if (!isEmailValid(raw)) return { error: "Введи корректный email." };
    where = { email: normalizeEmail(raw) };
  }
  if (password.trim().length < MIN_PASSWORD) return { error: "Введи пароль." };

  const user = await db.user.findFirst({ where });
  // Сообщение одно и то же — не подсказываем, что именно неверно.
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверный логин или пароль. Попробуй ещё раз 🐶" };
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);
  redirect("/profile");
}

/** Выход из аккаунта: чистим сессию и cookie, ведём на главную. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Обновление профиля (ник, район, telegram, согласия). Только для залогиненных. */
export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const name = String(formData.get("name") ?? "").trim();
  const districtId = String(formData.get("district") ?? "").trim();
  const telegram = normalizeTelegram(String(formData.get("telegram") ?? ""));
  const consentNotify = formData.get("consentNotify") != null;

  if (!name) return { error: "Имя не может быть пустым." };
  if (districtId && !findDistrict(districtId))
    return { error: "Не узнаю такой район — выбери из списка." };

  await db.user.update({
    where: { id: user.id },
    data: {
      name: name.slice(0, 80),
      district: districtId || null,
      telegram,
    },
  });

  // Согласие на уведомления пока носит демо-характер: просто подтверждаем.
  void consentNotify;
  return { saved: true };
}
