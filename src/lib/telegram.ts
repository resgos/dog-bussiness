import { db } from "@/lib/db";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Заглушка Telegram-доставки. Для реальной отправки нужен chat_id, который
 * появляется после того, как пользователь напишет боту /start (Bot API getUpdates
 * или webhook). Здесь — каркас: при заданном токене и сохранённом chat_id
 * вызывали бы https://api.telegram.org/bot<TOKEN>/sendMessage.
 * TODO(P1): хранить telegramChatId на User и слать sendMessage.
 */
export async function sendTelegram(
  userId: string,
  n: { title: string; body?: string },
  url?: string,
) {
  if (!TOKEN) return;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { telegram: true },
  });
  if (!user?.telegram) return;
  void n;
  void url;
  // Реальная отправка требует chat_id (не @username) — добавим в P1.
}
