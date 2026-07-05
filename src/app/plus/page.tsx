import { Check, Crown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PlusButton } from "@/components/plus/PlusButton";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Лапка+",
  description:
    "Премиум-подписка «Лапка+»: больше заботы о питомцах, приоритетное SOS-оповещение и поддержка проекта поиска.",
};

// Что получает владелец с подпиской «Лапка+».
const PERKS: { title: string; desc: string }[] = [
  {
    title: "Безлимит питомцев в профиле",
    desc: "Добавляйте всю стаю — без ограничений на число карточек.",
  },
  {
    title: "Приоритетное SOS-оповещение",
    desc: "Ваши объявления о пропаже видят соседи в первую очередь.",
  },
  {
    title: "Расширенные напоминания дневника здоровья",
    desc: "Прививки, обработки и осмотры — ничего не забудется.",
  },
  {
    title: "Бейдж «Лапка+» в комьюнити",
    desc: "Заметный значок рядом с вашим именем в ленте и обсуждениях.",
  },
  {
    title: "Ранний доступ к новым фичам",
    desc: "Первыми пробуйте всё, что мы готовим для стаи.",
  },
  {
    title: "Поддержка проекта поиска",
    desc: "Помогаете нам находить больше потерянных собак по Москве.",
  },
];

export default async function PlusPage() {
  const user = await getCurrentUser();
  const isPlus = user?.plan === "plus";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Шапка */}
        <Badge tone="paw">⭐ Лапка+</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Больше заботы с Лапка+
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Премиум для владельцев: безлимит питомцев, приоритетное SOS и ранний
          доступ к новым фичам. Подписка поддерживает проект поиска собак.
        </p>
        <p className="mt-4 inline-flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-coral">199 ₽</span>
          <span className="text-ink-soft">/мес</span>
        </p>

        {/* Преимущества */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="flex items-start gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blush-soft text-petal-deep">
                <Check className="size-5" aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold text-ink">{perk.title}</span>
                <span className="text-sm text-ink-soft">{perk.desc}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Блок оформления */}
        <div className="mt-8 rounded-3xl border border-blush bg-blush-soft p-6 shadow-card sm:p-8">
          <div className="mb-5 flex items-center gap-2 text-petal-deep">
            <Crown className="size-6 shrink-0" aria-hidden />
            <h2 className="text-xl font-bold">Оформление</h2>
          </div>

          {isPlus && user ? (
            <PlusButton active until={user.planUntil} />
          ) : (
            /* Тарифная сетка (P3 #13) видна и гостю — цены продают до входа;
               гостю вместо оплаты — мост в /auth. Перки в MVP общие, семейный —
               до 5 аккаунтов (механика приглашений — позже). */
            <div className="flex flex-col gap-5">
              {!user ? (
                <ShunyaBubble message="Чтобы оформить Лапка+, сначала войдите в стаю — и я всё подключу!" />
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-3xl border border-blush bg-card p-6 shadow-card">
                  <p className="text-lg font-bold text-ink">Личный · 199 ₽/мес</p>
                  <p className="text-sm text-ink-soft">
                    Все возможности Лапка+ для вас и вашей стаи.
                  </p>
                  {user ? (
                    <PlusButton tier="solo" priceLabel="199 ₽/мес" />
                  ) : (
                    <ButtonLink href="/auth" variant="secondary" size="md">
                      Войти и оформить
                    </ButtonLink>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-3xl border-2 border-paw bg-card p-6 shadow-card ring-1 ring-paw/40">
                  <p className="text-lg font-bold text-ink">
                    Семейный · 299 ₽/мес{" "}
                    <span className="text-petal-deep">· выгодно</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    До 5 аккаунтов семьи и общая стая питомцев.
                  </p>
                  {user ? (
                    <PlusButton tier="family" priceLabel="299 ₽/мес" />
                  ) : (
                    <ButtonLink href="/auth" size="md">
                      Войти и оформить
                    </ButtonLink>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
