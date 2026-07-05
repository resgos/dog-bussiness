import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, LogIn, MapPin, Phone, Send, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { timeAgo } from "@/lib/format";
import { sizeOptions } from "@/lib/petForm";
import { rankFoundForLost } from "@/lib/match";

export const dynamic = "force-dynamic";
export const metadata = { title: "Похожие находки" };

// Порог совпадения для показа находки. Чуть ниже дефолта lib/match (40), чтобы
// поднимать совпадения уровня «совпала порода/окрас» (одна сильная примета ≈ 25),
// а не только идеальные «район + порода». Должен совпадать с порогом в
// /profile/my-searches, иначе счётчик и список разойдутся.
const MIN_SCORE = 25;

/** Цвет бейджа совпадения по score (0–100). */
function matchBadgeTone(score: number): string {
  if (score >= 70) return "bg-status-found/15 text-status-found-ink";
  if (score >= 50) return "bg-paw/30 text-ink";
  return "bg-blush-soft text-ink-soft";
}

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  // —— Гость: призыв войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="petal">🔎 Похожие находки</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Войди в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <p className="text-ink-soft">
              Чтобы посмотреть находки, похожие на твою пропажу, войди в аккаунт —
              я подберу тех, кто совпадает по породе, окрасу и району.
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

  const { id } = await params;
  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report || report.userId !== user.id) notFound();

  const founds = await db.foundReport.findMany({ where: { status: "open" } });
  const matches = rankFoundForLost(report, founds, MIN_SCORE);

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/profile/my-searches"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        К моим поискам
      </Link>

      <div className="mt-4">
        <Badge tone="petal">
          <Sparkles className="size-3.5" aria-hidden />
          Умный матчинг
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Похожие находки · {report.petName}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Открытые находки, которые совпадают с приметами твоей пропажи. Узнал
          питомца — свяжись с тем, кто его нашёл, прямо отсюда.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <ShunyaBubble
            src="/shunya/sm/pose-surprised.png"
            message="Пока похожих находок нет — как появятся, покажу. Я держу нос по ветру!"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(({ item, score }) => {
            const districtName = item.district
              ? findDistrict(item.district)?.name
              : null;
            const sizeLabel =
              sizeOptions.find((o) => o.value === item.size)?.label ?? null;
            const facts = [item.breed, item.color, sizeLabel].filter(
              Boolean,
            ) as string[];
            const phone = item.contactPhone?.replace(/[^\d+]/g, "");
            const telegram = item.contactTelegram?.replace(/^@/, "");

            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card"
              >
                <div className="relative aspect-[4/3] bg-blush-soft">
                  {item.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.photo}
                      alt={`Найденная собака${item.breed ? ` · ${item.breed}` : ""}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 p-5 text-center">
                      <div className="relative size-20">
                        <Image
                          src="/shunya/sm/pose-surprised.png"
                          alt="Шуня"
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-petal-deep">
                        <Camera className="size-3.5" aria-hidden />
                        Фото не добавлено
                      </p>
                    </div>
                  )}
                  {/* Бейдж совпадения — цвет по силе */}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-soft ${matchBadgeTone(
                      score,
                    )}`}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    {score}% совпадение
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="text-lg font-bold text-ink">
                      {facts.length ? facts.join(" · ") : "Найдена собака"}
                    </h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>

                  {districtName ? (
                    <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                      <MapPin className="size-4 text-petal" aria-hidden />
                      Район: {districtName}
                    </p>
                  ) : null}

                  {item.comment ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-ink">
                      {item.comment}
                    </p>
                  ) : null}

                  {phone || telegram ? (
                    <div className="mt-auto rounded-2xl bg-blush-soft p-3.5">
                      <p className="text-xs font-bold text-ink">
                        {item.finderName
                          ? `${item.finderName} нашёл(ла):`
                          : "Нашли — свяжитесь:"}
                      </p>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                          >
                            <Phone className="size-4" aria-hidden />
                            {item.contactPhone}
                          </a>
                        ) : null}
                        {telegram ? (
                          <a
                            href={`https://t.me/${telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
                          >
                            <Send className="size-4" aria-hidden />
                            {item.contactTelegram}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-auto text-xs text-ink-soft">
                      Контакты не указаны — отслеживай в ленте находок.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Container>
  );
}
