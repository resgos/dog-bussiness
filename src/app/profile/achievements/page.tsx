import Link from "next/link";
import { Check, LogIn, Lock, PawPrint } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENTS, computeAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";
export const metadata = { title: "Достижения" };

// Реплика Шуни подстраивается под прогресс — от «давай начнём» до «вся стая тобой гордится».
function shunyaLine(earned: number, total: number): string {
  if (earned === 0) {
    return "Тут живут наши с тобой награды. Добавь питомца или помоги найти собаку — и первый бейдж твой! 🐾";
  }
  if (earned >= total) {
    return "Невероятно — ты собрал все награды стаи! Нюх у тебя точно как у меня. Горжусь! 🏆";
  }
  if (earned === 1) {
    return "Есть первая награда! Это только начало — впереди ещё много добрых дел. 💛";
  }
  return `Уже ${earned} ${earned < 5 ? "награды" : "наград"} в копилке — стая тобой гордится. Так держать! 🐕`;
}

export default async function AchievementsPage() {
  const user = await getCurrentUser();

  // —— Гость: призыв войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="paw">🏆 Достижения</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Войди в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <p className="text-ink-soft">
              Здесь копятся твои награды: первый питомец, лайки на постах и
              спасённые хвосты. Войди, чтобы открывать бейджи и следить за
              прогрессом.
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

  // —— Сбор статистики (независимые запросы — параллельно) ——
  const [pets, likes, complete] = await Promise.all([
    db.pet.count({ where: { userId: user.id } }),
    // Лайки именно на ПОСТАХ пользователя, а не поставленные им самим.
    db.postLike.count({ where: { post: { authorId: user.id } } }),
    // Питомец считается «досье на 100%», когда заполнены ключевые поля.
    db.pet.count({
      where: {
        userId: user.id,
        photo: { not: null },
        breed: { not: null },
        district: { not: null },
        marksText: { not: null },
      },
    }),
  ]);
  const helped = user.helpedCount;

  const list = computeAchievements({ pets, likes, helped, complete });
  const earned = list.filter((a) => a.earned).length;
  const total = ACHIEVEMENTS.length;

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="paw">🏆 Достижения</Badge>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Достижения</h1>
      <p className="mt-2 text-ink-soft">
        Награды стаи за заботу о питомцах и помощь в поисках.
      </p>

      <div className="mt-6">
        <ShunyaBubble message={shunyaLine(earned, total)} />
      </div>

      <p className="mt-6 text-sm font-semibold text-petal-deep">
        Получено {earned} из {total}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <h2 className="text-lg font-bold text-ink">{a.title}</h2>
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

      <div className="mt-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-petal-deep transition hover:text-petal"
        >
          <PawPrint className="size-4" aria-hidden />
          Назад в личный кабинет
        </Link>
      </div>
    </Container>
  );
}
