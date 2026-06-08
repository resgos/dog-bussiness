import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Создаёт токен подтверждения e-mail и отправляет письмо со ссылкой.
 * Мягкая верификация: вход не блокируется, это лишь подтверждённый бейдж.
 * Ошибки не пробрасываем — регистрация не должна падать из-за письма.
 */
export async function sendVerificationEmail(userId: string, email: string) {
  try {
    const token = randomBytes(32).toString("hex");
    await db.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 часа
      },
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
    const url = `${base}/verify?token=${token}`;
    await sendEmail(
      email,
      "Подтвердите e-mail — Лапка помощи",
      `Подтвердите адрес электронной почты, перейдя по ссылке:\n\n${url}\n\nЕсли вы не регистрировались — просто игнорируйте это письмо.`,
    );
  } catch (e) {
    console.error("sendVerificationEmail failed", e);
  }
}
