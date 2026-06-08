import { db } from "@/lib/db";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.TELEGRAM_CHANNEL_ID;

/**
 * Публикация в районный Telegram-канал/чат (если заданы токен бота и id канала).
 * Главный канал охвата в РФ: собачники сидят в районных ТГ-чатах.
 * Без env — тихий no-op (готовый шов: добавьте TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID).
 */
export async function sendTelegramChannel(text: string) {
  if (!TOKEN || !CHANNEL) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL,
        text,
        disable_web_page_preview: false,
      }),
    });
  } catch (e) {
    console.error("sendTelegramChannel failed", e);
  }
}

/**
 * Персональная доставка в Telegram (заглушка): нужен chat_id пользователя,
 * который появляется после /start у бота. TODO(P1): хранить telegramChatId
 * на User и слать sendMessage адресно.
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
}
