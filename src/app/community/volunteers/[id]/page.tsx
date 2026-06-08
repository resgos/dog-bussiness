import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Check,
  Eye,
  Lock,
  MapPin,
  PawPrint,
} from "lucide-react";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { plural, timeAgo } from "@/lib/format";
import { computeAchievements } from "@/lib/achievements";
import { roleInfo } from "@/components/community/postMeta";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user ? `${user.name} — волонтёр` : "Профиль волонтёра" };
}

export default async function VolunteerProfilePage({ params }: PageProps) {
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  // Статистика вклада — независимые запросы выполняем параллельно.
  const [pets, likes, complete, sightingsCount] = await Promise.all([
    db.pet.count({ where: { userId: id } }),
    // Лайки на постах этого человека (признание стаи), а не поставленные им.
    db.postLike.count({ where: { post: { authorId: id } } }),
    // «Досье на 100%» — заполнены ключевые поля питомца.
    db.pet.count({
      where: {
        userId: id,
        photo: { not: null },
        breed: { not: null },
        district: { not: null },
        marksText: { not: null },
      },
    }),
    db.sighting.count({ where: { userId: id } }),
  ]);
  const helped = user.helpedCount;

  const list = computeAchievements({ pets, likes, helped, complete });
  const earned = list.filter((a) => a.earned);

  const role = roleInfo(user.role);
  const district = user.district ? findDistrict(user.district)?.name : null;
  const initial = user.name.trim().charAt(0).toUpperCase() || "🐾";

  return (
    <Container className="py-12 sm:py-16">
      {/* Назад к рейтингу */}
      <Link
        href="/community/volunteers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
      >
        <ArrowLeft className="size-4" aria-hidden />
        К рейтингу
      </Link>

      {/* Герой профиля */}
      <div className="mt-6 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blush-soft text-3xl font-bold text-petal-deep sm:size-24"
            aria-hidden
          >
            {initial}
          </span>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{user.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={role.tone}>
                <span aria-hidden>{role.emoji}</span>
                {role.label}
              </Badge>
              {district ? (
                <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                  <MapPin className="size-3.5 text-petal" aria-hidden />
                  {district}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              В стае {timeAgo(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Метрики вклада */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-blush-soft p-4 text-center">
            <div className="text-2xl font-bold text-petal-deep sm:text-3xl">
              {user.helpedCount}
            </div>
            <div className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-ink-soft">
              <PawPrint className="size-3.5 text-petal" aria-hidden />
              помог найти
            </div>
          </div>
          <div className="rounded-2xl bg-blush-soft p-4 text-center">
            <div className="text-2xl font-bold text-ink sm:text-3xl">
              {sightingsCount}
            </div>
            <div className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-ink-soft">
              <Eye className="size-3.5 text-petal" aria-hidden />
              {plural(sightingsCount, "наблюдение", "наблюдения", "наблюдений")}
            </div>
          </div>
          <div className="rounded-2xl bg-blush-soft p-4 text-center">
            <div className="text-2xl font-bold text-ink sm:text-3xl">{pets}</div>
            <div className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-ink-soft">
              <PawPrint className="size-3.5 text-petal" aria-hidden />
              {plural(pets, "питомец", "питомца", "питомцев")}
            </div>
          </div>
        </div>
      </div>

      {/* Достижения */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Award className="size-6 text-petal" aria-hidden />
          <h2 className="text-xl font-bold text-ink sm:text-2xl">Достижения</h2>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Получено {earned.length} из {list.length}
        </p>

        {earned.length === 0 ? (
          <div className="mt-5">
            <ShunyaBubble message="Пока без бейджей — всё впереди! Каждое доброе дело приближает первую награду. 🐾" />
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <article
              key={a.key}
              className={
                a.earned
                  ? "flex flex-col gap-3 rounded-3xl border-2 border-petal bg-card p-5 shadow-card"
                  : "flex flex-col gap-3 rounded-3xl border border-blush bg-card p-5 opacity-70"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-4xl leading-none" aria-hidden>
                  {a.emoji}
                </span>
                {a.earned ? (
                  <span className="flex size-8 items-center justify-center rounded-full bg-paw text-ink">
                    <Check className="size-5" aria-hidden />
                  </span>
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-blush-soft text-ink-soft">
                    <Lock className="size-4" aria-hidden />
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-ink">{a.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{a.desc}</p>
              </div>

              {a.earned ? (
                <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-blush-soft px-3 py-1 text-xs font-semibold text-petal-deep">
                  <Check className="size-3.5" aria-hidden />
                  Получено
                </span>
              ) : (
                <div className="mt-auto">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blush-soft">
                    <div
                      className="h-full rounded-full bg-paw transition-all"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs font-semibold text-ink-soft">
                    {a.have}/{a.goal}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
