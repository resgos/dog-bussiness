import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
const TTL_MS = 60 * 60 * 1000; // 1 час

/**
 * Запрос на сброс пароля (ТЗ 4.1).
 * Тело: { email }. Всегда отвечает { ok: true } — не раскрываем,
 * существует ли аккаунт с таким email (защита от перебора).
 */
export async function POST(req: Request) {
  // Защита от mail-bombing и накопления токенов сброса (ответ не меняем — не палим лимит).
  if (!(await rateLimit(ipKey(req, "forgot"), 3, 60_000))) {
    return NextResponse.json({ ok: true });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();

  if (email) {
    try {
      const user = await db.user.findUnique({ where: { email } });
      // Письмо шлём только если есть пользователь и у него задан email.
      if (user && user.email) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + TTL_MS);
        await db.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt },
        });

        const link = `${SITE_URL}/auth/reset?token=${token}`;
        const text = [
          "Привет! 🐾",
          "",
          "Кто-то (надеемся, что ты) попросил сбросить пароль на «Лапке помощи».",
          "Чтобы задать новый пароль, перейди по ссылке — она действует 1 час:",
          "",
          link,
          "",
          "Если ты этого не делал(а) — просто проигнорируй письмо, пароль останется прежним.",
        ].join("\n");
        const html = `
          <p>Привет! 🐾</p>
          <p>Кто-то (надеемся, что ты) попросил сбросить пароль на «Лапке помощи».</p>
          <p>Чтобы задать новый пароль, перейди по ссылке — она действует 1 час:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Если ты этого не делал(а) — просто проигнорируй письмо, пароль останется прежним.</p>
        `;

        await sendEmail(email, "Сброс пароля — Лапка помощи", text, html);
      }
    } catch (e) {
      // Любая ошибка (БД/почта) не должна выдавать наличие аккаунта.
      console.error("forgot-password failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
