import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ModerationControls } from "@/components/moderation/ModerationControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Модерация" };

const MOD_ROLES = ["ambassador", "admin"];

// Человекочитаемые подписи типов контента и причин жалоб.
const TARGET_LABELS: Record<string, string> = {
  post: "Пост",
  found: "Находка",
  lost: "Пропажа",
  comment: "Комментарий",
};

const REASON_LABELS: Record<string, string> = {
  spam: "Спам",
  abuse: "Оскорбление",
  fake: "Фейк",
  other: "Другое",
};

export default async function ModerationPage() {
  const user = await getCurrentUser();

  if (!user || !MOD_ROLES.includes(user.role)) {
    return (
      <Container className="py-12 sm:py-16">
        <Badge tone="petal">🛡️ Модерация</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Очередь модерации</h1>
        <div className="mt-8 rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <p className="text-lg font-semibold text-ink">
            Доступ только для модераторов
          </p>
          <p className="mt-1 text-ink-soft">
            Этот раздел открыт амбассадорам и администраторам.
          </p>
        </div>
      </Container>
    );
  }

  const reports = await db.report.findMany({
    where: { status: "open" },
    include: { reporter: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <Badge tone="petal">🛡️ Модерация</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Очередь модерации</h1>
        <p className="mt-1 text-ink-soft">
          {reports.length > 0
            ? `Открытых жалоб: ${reports.length}`
            : "Жалоб нет — в сообществе спокойно."}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <p className="text-ink-soft">
            Пока всё чисто. Спасибо, что бережёте нашу стаю! 🐾
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Badge tone="neutral">
                  {TARGET_LABELS[r.targetType] ?? r.targetType}
                </Badge>
                <Badge tone="lost">
                  {REASON_LABELS[r.reason] ?? r.reason}
                </Badge>
                <span className="ml-auto text-xs text-ink-soft">
                  {timeAgo(r.createdAt)}
                </span>
              </div>

              <p className="text-sm text-ink-soft">
                ID объекта:{" "}
                <span className="font-mono text-ink">{r.targetId}</span>
              </p>

              {r.comment ? (
                <p className="whitespace-pre-line rounded-2xl bg-blush-soft px-4 py-2.5 text-sm leading-relaxed text-ink">
                  {r.comment}
                </p>
              ) : null}

              <p className="text-xs text-ink-soft">
                Пожаловался: {r.reporter?.name ?? "Гость"}
              </p>

              <ModerationControls id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
