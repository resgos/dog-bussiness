import { notFound } from "next/navigation";
import { ArrowLeft, HeartPulse } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { HealthForm } from "@/components/pets/HealthForm";
import { HealthList } from "@/components/pets/HealthList";
import type { HealthRecordView } from "@/components/pets/HealthList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Дневник здоровья" };

/** Полных дней от сегодня (без времени) до целевой даты. */
function daysUntil(date: Date): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export default async function PetHealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  // Гость — мягко зовём войти, без жёсткого редиректа.
  if (!user) {
    return (
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
            <ShunyaBubble message="Дневник здоровья «Лапка+» — для твоих питомцев. Войди, и я покажу прививки, обработки и напоминания." />
            <div className="mt-6">
              <ButtonLink href="/auth" size="lg">
                Войти
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const pet = await db.pet.findUnique({ where: { id } });
  // Нет питомца или это не его — 404, чтобы не раскрывать чужие данные.
  if (!pet || pet.userId !== user.id) {
    notFound();
  }

  const records = await db.healthRecord.findMany({
    where: { petId: id },
    orderBy: { date: "desc" },
  });

  // Свод напоминаний по nextDue: просрочено (< сегодня) и скоро (≤ 30 дней).
  let overdue = 0;
  let soon = 0;
  for (const r of records) {
    if (!r.nextDue) continue;
    const d = daysUntil(r.nextDue);
    if (d < 0) overdue += 1;
    else if (d <= 30) soon += 1;
  }

  // Сериализуем для client-компонента (Date → ISO-строки).
  const view: HealthRecordView[] = records.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    date: r.date.toISOString(),
    nextDue: r.nextDue ? r.nextDue.toISOString() : null,
    value: r.value,
    note: r.note,
  }));

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <ButtonLink href="/profile/pets" variant="ghost" size="sm">
          <ArrowLeft className="size-4" aria-hidden />
          К моим питомцам
        </ButtonLink>

        <div className="mt-4">
          <Badge tone="petal">
            <HeartPulse className="size-3.5" aria-hidden />
            Лапка+
          </Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Дневник здоровья · {pet.name}
          </h1>
          <p className="mt-2 text-ink-soft">
            Прививки, обработки от паразитов, вес и визиты к ветеринару — с
            напоминанием о сроках.
          </p>
        </div>

        {/* Баннер напоминаний — показываем, только если есть что напомнить. */}
        {overdue > 0 || soon > 0 ? (
          <div className="mt-6 rounded-3xl border border-blush bg-card p-5 shadow-card">
            <p className="text-sm font-semibold text-ink">Напоминания</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {overdue > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-status-lost/30 bg-status-lost/10 px-4 py-2 text-sm font-bold text-status-lost-ink">
                  🔴 просрочено: {overdue}
                </span>
              ) : null}
              {soon > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-2 text-sm font-bold text-ink">
                  🟡 скоро: {soon}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <HealthForm petId={id} />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-ink">История записей</h2>
          <HealthList records={view} />
        </div>
      </div>
    </Container>
  );
}
