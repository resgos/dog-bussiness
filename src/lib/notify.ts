import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { sendEmail } from "@/lib/email";
import { sendTelegram } from "@/lib/telegram";

export type NotifyInput = {
  type?: string; // sos | found | system | info
  title: string;
  body?: string;
  link?: string;
};

function absUrl(link?: string): string | undefined {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!link) return base || undefined;
  return `${base}${link}`;
}

/**
 * Создаёт in-app уведомление И доставляет его по всем настроенным каналам
 * (web-push, e-mail, Telegram). Доставка не блокирует и не валит вызов:
 * ошибки каналов гасятся, БД-запись создаётся всегда.
 */
export async function notifyUser(userId: string, n: NotifyInput) {
  const notif = await db.notification.create({
    data: {
      userId,
      type: n.type ?? "info",
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    },
  });

  const url = absUrl(n.link);
  await Promise.allSettled([
    sendPushToUser(userId, { title: n.title, body: n.body, url }),
    deliverEmail(userId, n, url),
    sendTelegram(userId, n, url),
  ]);

  return notif;
}

/** Рассылка одного уведомления списку пользователей (SOS-район, матчинг находок). */
export async function notifyMany(userIds: string[], n: NotifyInput) {
  await Promise.allSettled(userIds.map((id) => notifyUser(id, n)));
}

async function deliverEmail(userId: string, n: NotifyInput, url?: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return;
  const body = `${n.body ?? ""}${url ? `\n\n${url}` : ""}`.trim();
  await sendEmail(user.email, n.title, body || n.title);
}
