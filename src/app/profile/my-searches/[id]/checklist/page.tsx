import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseChecklist } from "@/lib/searchSteps";
import { SearchChecklist } from "@/components/profile/SearchChecklist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Чек-лист поиска" };

export default async function SearchChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const { id } = await params;
  const report = await db.lostReport.findUnique({ where: { id } });
  // Нет объявления или это не его — 404, чтобы не раскрывать чужие данные.
  if (!report || report.userId !== user.id) notFound();

  const initial = parseChecklist(report.checklist);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile/my-searches"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-petal-deep"
        >
          <ArrowLeft className="size-4" aria-hidden />
          К моим поискам
        </Link>

        <div className="mt-4">
          <Badge tone="petal">📋 Чек-лист</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Чек-лист поиска · {report.petName}
          </h1>
          <p className="mt-2 text-ink-soft">
            Системный поиск находит собак быстрее. Отмечай, что уже сделал.
          </p>
        </div>

        <div className="mt-8">
          <SearchChecklist
            reportId={id}
            petName={report.petName}
            initial={initial}
          />
        </div>

        <Link
          href="/guide/lost"
          className="mt-6 flex items-start gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card transition hover:bg-blush-soft sm:p-6"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-ink">
              Подробный план первых 24 часов →
            </span>
            <span className="mt-0.5 block text-sm text-ink-soft">
              Что делать по шагам, чтобы вернуть собаку домой.
            </span>
          </span>
        </Link>
      </div>
    </Container>
  );
}
