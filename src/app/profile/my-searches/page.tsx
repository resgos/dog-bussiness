import Link from "next/link";
import { Clock, Eye, Gift, ListChecks, LogIn, MapPin, PawPrint, Printer, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";
import { rankFoundForLost } from "@/lib/match";
import { parseChecklist, SEARCH_STEPS } from "@/lib/searchSteps";
import { SearchControls } from "@/components/profile/SearchControls";

// Порог совпадения — держим синхронно со страницей matches, иначе бейдж
// «N возможных находок» соврёт про число карточек. См. комментарий там же.
const MIN_MATCH_SCORE = 25;

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои поиски" };

const statusInfo: Record<
  string,
  { label: string; tone: "lost" | "found" | "neutral" }
> = {
  active: { label: "Активный поиск", tone: "lost" },
  found: { label: "Найдена", tone: "found" },
  home: { label: "Снят с публикации", tone: "neutral" },
};

export default async function MySearchesPage() {
  const user = await getCurrentUser();

  // —— Гость: призыв войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="petal">🐾 Мои поиски</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Войди в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <p className="text-ink-soft">
              Здесь собираются твои объявления о пропаже. Войди, чтобы вести
              поиски и получать уведомления, когда кто-то увидит твою собаку.
            </p>
            <div className="mt-6">
              <ButtonLink href="/auth" size="lg">
                <LogIn className="size-5" aria-hidden />
                Войти или зарегистрироваться
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const reports = await db.lostReport.findMany({
    where: { userId: user.id },
    include: { sightings: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Открытые находки грузим один раз — матчим против каждой активной пропажи.
  // Матчингу (lib/match) нужны только приметы — НЕ тянем photo (data URL), иначе
  // на каждый рендер «Мои поиски» прилетают все фото всех находок города.
  const founds = await db.foundReport.findMany({
    where: { status: "open" },
    select: {
      id: true,
      breed: true,
      color: true,
      size: true,
      district: true,
      createdAt: true,
    },
  });

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="petal">🐾 Мои поиски</Badge>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Мои поиски</h1>
      <p className="mt-2 text-ink-soft">
        Объявления о пропаже, привязанные к твоему аккаунту.
      </p>

      {/* —— Пустое состояние —— */}
      {reports.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
            <PawPrint className="size-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-bold">Пока всё спокойно 🐾</h2>
          <p className="mt-2 text-ink-soft">
            У тебя нет активных поисков — и пусть так и остаётся. Если собака
            всё же потеряется, подай SOS, и стая поднимется на помощь.
          </p>
          <div className="mt-6">
            <ButtonLink href="/sos" variant="sos" size="lg">
              Подать SOS о пропаже
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {reports.map((report) => {
            const district = report.district
              ? findDistrict(report.district)?.name
              : null;
            const info = statusInfo[report.status] ?? statusInfo.active;
            const sCount = report.sightings.length;
            const when = report.lostAt ?? report.createdAt;
            // Похожие находки ищем только для активных пропаж.
            const matchCount =
              report.status === "active"
                ? rankFoundForLost(report, founds, MIN_MATCH_SCORE).length
                : 0;

            return (
              <article
                key={report.id}
                className="flex flex-col gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{report.petName}</h3>
                    <p className="text-sm text-ink-soft">
                      {report.breed || "Порода не указана"}
                    </p>
                  </div>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-ink-soft">
                  {district ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-petal" aria-hidden />
                      {district}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-petal" aria-hidden />
                    {timeAgo(when)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-petal-deep">
                    <Eye className="size-4" aria-hidden />
                    {sCount}{" "}
                    {plural(
                      sCount,
                      "наблюдение",
                      "наблюдения",
                      "наблюдений",
                    )}
                  </span>
                  {report.reward ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                      <Gift className="size-4 text-coral" aria-hidden />
                      Награда {report.reward.toLocaleString("ru-RU")} ₽
                    </span>
                  ) : null}
                </div>

                {matchCount > 0 ? (
                  <Link
                    href={`/profile/my-searches/${report.id}/matches`}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-blush-soft px-3 py-2 text-sm font-bold text-petal-deep transition hover:bg-blush"
                  >
                    <Search className="size-4" aria-hidden />
                    🔎 {matchCount}{" "}
                    {plural(
                      matchCount,
                      "возможная находка",
                      "возможные находки",
                      "возможных находок",
                    )}{" "}
                    →
                  </Link>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <SearchControls id={report.id} status={report.status} />
                  {report.status === "active" ? (
                    <ButtonLink href={`/poster/${report.id}`} variant="secondary" size="sm">
                      <Printer className="size-4" aria-hidden />
                      Плакат
                    </ButtonLink>
                  ) : null}
                  {report.status === "active" ? (
                    <ButtonLink
                      href={`/profile/my-searches/${report.id}/checklist`}
                      variant="secondary"
                      size="sm"
                    >
                      <ListChecks className="size-4" aria-hidden />
                      Чек-лист {parseChecklist(report.checklist).length}/
                      {SEARCH_STEPS.length}
                    </ButtonLink>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Container>
  );
}
