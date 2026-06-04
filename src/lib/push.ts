import webpush from "web-push";
import { db } from "@/lib/db";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@example.com";

let ready: boolean | null = null;
function configured(): boolean {
  if (ready !== null) return ready;
  if (PUBLIC && PRIVATE) {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
    ready = true;
  } else {
    ready = false;
  }
  return ready;
}

export function isPushConfigured() {
  return Boolean(PUBLIC && PRIVATE);
}

type PushPayload = { title: string; body?: string; url?: string };

/** Отправляет web-push всем подпискам пользователя. Мёртвые подписки чистит. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configured()) return;
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;
  const data = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
