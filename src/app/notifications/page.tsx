import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";
export const metadata = { title: "Уведомления" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Container className="py-12 sm:py-16">
        <Badge tone="petal">🔔 Уведомления</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Уведомления</h1>
        <div className="mt-8 rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Войдите, чтобы видеть уведомления — я подскажу, если рядом кто-то потеряется или найдётся. 🐾" />
          <div className="mt-6">
            <ButtonLink href="/auth" variant="primary" size="lg">
              Войти
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  const items = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <Badge tone="petal">🔔 Уведомления</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Уведомления</h1>
        <p className="mt-1 text-ink-soft">
          {unread > 0
            ? `Непрочитанных: ${unread}`
            : "Всё прочитано — отличная работа!"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Пока тихо — ни одной новости. Как только рядом кто-то потеряется или найдётся, я сразу дам знать. 🐾" />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const inner = (
              <div className="flex items-start gap-3">
                <span
                  className={`mt-2 size-2.5 shrink-0 rounded-full ${
                    n.read ? "bg-transparent ring-1 ring-blush" : "bg-petal"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 text-sm leading-snug text-ink-soft">
                      {n.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink-soft">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read ? (
                  <Badge tone="petal" className="shrink-0">
                    Новое
                  </Badge>
                ) : null}
              </div>
            );

            const cardClass = `block rounded-3xl border border-blush bg-card p-5 shadow-card transition-colors ${
              n.read ? "" : "ring-1 ring-blush"
            }`;

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className={`${cardClass} hover:bg-blush-soft`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cardClass}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
