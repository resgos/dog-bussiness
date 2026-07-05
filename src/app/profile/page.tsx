import Link from "next/link";
import {
  Award,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PushToggle } from "@/components/notifications/PushToggle";
import { VerifyBanner } from "@/components/auth/VerifyBanner";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { logoutAction } from "@/components/auth/actions";
import { roleInfo } from "@/components/community/postMeta";
import { ACHIEVEMENTS, earnedCount } from "@/lib/achievements";

export const dynamic = "force-dynamic";
export const metadata = { title: "Личный кабинет" };

const navItems: {
  href: string;
  label: string;
  desc: string;
  icon: typeof PawPrint;
}[] = [
  { href: "/profile/pets", label: "Мои питомцы", desc: "Карточки и QR-паспорта", icon: PawPrint },
  { href: "/profile/my-searches", label: "Мои поиски", desc: "SOS-объявления и наблюдения", icon: Search },
  { href: "/profile/pets/add", label: "Добавить питомца", desc: "Новая карточка в стаю", icon: Plus },
  { href: "/profile/orders", label: "Мои заказы", desc: "Адресники и мерч", icon: ShoppingBag },
  { href: "/profile/achievements", label: "Достижения", desc: "Бейджи и прогресс", icon: Trophy },
  { href: "/profile/my-pack", label: "Моя стая", desc: "Соседи и питомцы рядом", icon: Users },
  { href: "/profile/settings", label: "Настройки", desc: "Профиль и согласия", icon: Settings },
];

export default async function ProfilePage() {
  const user = await getCurrentUser();

  // —— Гость: дружелюбное приглашение войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="petal">🐾 Личный кабинет</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Войди в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <ShunyaBubble
              src="/shunya/sm/pose-wave.png"
              message="Тут живёт твой профиль, питомцы и достижения. Зайди — и я покажу, что у нас в стае происходит!"
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/auth" size="lg">
                <LogIn className="size-5" aria-hidden />
                Войти или зарегистрироваться
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" size="lg">
                На главную
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // —— Участник: карточка профиля + навигация ——
  const district = user.district ? findDistrict(user.district) : undefined;
  const contact = user.phone || user.email || "—";

  // Полоска достижений: считаем те же метрики, что и страница /profile/achievements.
  const [pets, likes, complete] = await Promise.all([
    db.pet.count({ where: { userId: user.id } }),
    db.postLike.count({ where: { post: { authorId: user.id } } }),
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
  const earned = earnedCount({ pets, likes, helped: user.helpedCount, complete });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="petal">🐾 Личный кабинет</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Привет, {user.name}!
          </h1>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost">
            <LogOut className="size-4" aria-hidden />
            Выйти
          </Button>
        </form>
      </div>

      {/* Мягкое напоминание подтвердить e-mail (не блокирует доступ).
          Сам баннер вернёт null, если e-mail нет или он уже подтверждён —
          поэтому отступ задаём внутри компонента, без пустой обёртки. */}
      <VerifyBanner
        email={user.email}
        verified={Boolean(user.emailVerifiedAt)}
      />

      {/* Карточка профиля */}
      <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-blush-soft text-petal-deep">
            <PawPrint className="size-9" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <Badge tone="paw">
                <Award className="size-3.5" aria-hidden />
                {roleInfo(user.role).label}
              </Badge>
              {user.plan === "plus" ? (
                <Badge tone="paw">
                  <Star className="size-3.5 fill-current" aria-hidden />
                  ⭐ Лапка+
                </Badge>
              ) : null}
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 text-ink">
                {user.email && !user.phone ? (
                  <Mail className="size-4 shrink-0 text-petal" aria-hidden />
                ) : (
                  <Phone className="size-4 shrink-0 text-petal" aria-hidden />
                )}
                <span className="truncate">{contact}</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <MapPin className="size-4 shrink-0 text-petal" aria-hidden />
                <span className="truncate">
                  {district ? `${district.name} · ${district.okrug}` : "Район не выбран"}
                </span>
              </div>
              {user.telegram ? (
                <div className="flex items-center gap-2.5 text-ink">
                  <Send className="size-4 shrink-0 text-petal" aria-hidden />
                  <span className="truncate">{user.telegram}</span>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="flex shrink-0 flex-col items-center rounded-2xl bg-paw/20 px-6 py-4 text-center">
            <span className="text-3xl font-bold text-coral">{user.helpedCount}</span>
            <span className="mt-1 text-xs font-semibold text-ink-soft">
              помог найти
            </span>
          </div>
        </div>
      </div>

      {/* Компактная полоска достижений — ведёт на /profile/achievements */}
      <Link
        href="/profile/achievements"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-blush-soft px-4 py-3 text-sm font-semibold text-petal-deep transition hover:bg-blush"
      >
        <span className="inline-flex items-center gap-2">
          <Trophy className="size-4" aria-hidden />
          🏅 Достижения: {earned} из {ACHIEVEMENTS.length} получено
        </span>
        <span aria-hidden>→</span>
      </Link>

      {/* CTA подписки — только для тех, у кого ещё нет «Лапка+» */}
      {user.plan !== "plus" ? (
        <Link
          href="/plus"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-blush-soft px-4 py-3 text-sm font-semibold text-petal-deep transition hover:bg-blush"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden />
            ⭐ Оформи Лапка+ — больше заботы
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <div className="mt-8">
        <PushToggle />
      </div>

      {/* Навигация ЛК */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map(({ href, label, desc, icon: Icon }) => (
          <ButtonLink
            key={href}
            href={href}
            variant="secondary"
            className="h-auto items-start justify-start gap-4 rounded-3xl !px-5 py-5 text-left"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-bold text-ink">{label}</span>
              <span className="text-sm font-normal text-ink-soft">{desc}</span>
            </span>
          </ButtonLink>
        ))}
      </div>
    </Container>
  );
}
