import { ArrowLeft, LogIn, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { InviteCard } from "@/components/profile/InviteCard";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Пригласить соседа" };

/** Со скольких приглашённых начинается бейдж «Посол стаи». */
const AMBASSADOR_THRESHOLD = 3;

export default async function InvitePage() {
  const user = await getCurrentUser();

  // —— Гость: дружелюбное приглашение войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="petal">🐾 Пригласить соседа</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Зови соседей в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <ShunyaBubble
              src="/shunya/sm/pose-wave.png"
              message="Чтобы получить личную ссылку-приглашение, заходи в стаю. Чем нас больше в районе — тем быстрее находим потеряшек!"
            />
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

  // Сколько соседей пришло именно по приглашению этого пользователя.
  const invited = await db.user.count({ where: { referredById: user.id } });
  const isAmbassador = invited >= AMBASSADOR_THRESHOLD;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Badge tone="petal">🐾 Пригласить соседа</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Зови соседей в стаю</h1>
        <p className="mt-3 text-ink-soft">
          Чем больше внимательных глаз в районе — тем быстрее мы находим
          потерявшихся собак. Позови соседа: один взгляд из окна порой решает всё.
        </p>

        <div className="mt-8">
          <InviteCard code={user.referralCode} invited={invited} />
        </div>

        {/* Счётчик приглашённых + бейдж-ачивка «Посол стаи» */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-3xl border border-blush bg-blush-soft px-6 py-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card text-petal-deep shadow-soft">
            <Users className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-soft">
              Соседей в стае по твоей ссылке
            </p>
            <p className="text-3xl font-bold text-coral">{invited}</p>
          </div>
          {isAmbassador ? (
            <Badge tone="paw" className="text-sm">
              🏅 Посол стаи
            </Badge>
          ) : (
            <p className="text-xs text-ink-soft">
              Ещё {AMBASSADOR_THRESHOLD - invited} — и ты «🏅 Посол стаи»
            </p>
          )}
        </div>

        <div className="mt-8">
          <ButtonLink href="/profile" variant="ghost">
            <ArrowLeft className="size-4" aria-hidden />
            В личный кабинет
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
