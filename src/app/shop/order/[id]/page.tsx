import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { timeAgo } from "@/lib/format";

// Статус заказа меняется (new → processing → done) — всегда свежие данные.
export const dynamic = "force-dynamic";

// Дедуп выборки между generateMetadata и страницей (один запрос вместо двух).
const getOrder = cache((id: string) =>
  db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  }),
);

// Копирайт и тон зависят от статуса: страница двойного назначения —
// подтверждение сразу после чекаута И посадочная из «Моих заказов» (где заказ
// может быть уже выполнен). Тоны бейджа согласованы с /profile/orders.
const STATUS: Record<
  string,
  { label: string; tone: "petal" | "neutral" | "found"; h1: string; sub: string }
> = {
  new: {
    label: "Заказ принят",
    tone: "petal",
    h1: "Спасибо! Уже мчим за заказом 🐾",
    sub: "Мы свяжемся с тобой по телефону для подтверждения и доставки.",
  },
  processing: {
    label: "Собираем",
    tone: "neutral",
    h1: "Собираем ваш заказ 📦",
    sub: "Курьер свяжется с тобой по телефону перед доставкой.",
  },
  done: {
    label: "Выполнен",
    tone: "found",
    h1: "Заказ выполнен 🎉",
    sub: "Спасибо, что выбираешь «Лапку»! Адресник уже бережёт твоего хвостатого.",
  },
};

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrder(id);
  const meta = order ? (STATUS[order.status] ?? STATUS.new) : null;
  return { title: meta ? meta.label : "Заказ" };
}

/**
 * Подтверждение/детали заказа. Без контактных данных покупателя (PII): доступна
 * по непереборному cuid-id и для гостевых заказов — только номер, состав и сумма.
 * «Мои заказы» показываем лишь владельцу (гостя это увело бы в логин-стену и
 * пустой список — гостевой заказ не привязан к аккаунту).
 */
export default async function OrderConfirmationPage({ params }: Params) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const s = STATUS[order.status] ?? STATUS.new;
  const shortNo = order.id.slice(0, 8);
  const user = await getCurrentUser().catch(() => null);
  const isOwnerView = Boolean(order.userId && user?.id === order.userId);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-blush bg-card p-8 text-center shadow-card sm:p-10">
        <div className="mb-3 flex justify-center">
          <Badge tone={s.tone}>{s.label}</Badge>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{s.h1}</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Заказ{" "}
          <span className="font-mono font-semibold text-ink">{`#${shortNo}`}</span>{" "}
          оформлен {timeAgo(order.createdAt)}. {s.sub}
        </p>

        {/* Состав заказа */}
        <div className="mt-6 rounded-2xl border border-blush bg-blush-soft/40 p-5 text-left">
          <div className="divide-y divide-blush">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-baseline gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {item.product.name}
                    {item.qty > 1 ? ` × ${item.qty}` : ""}
                  </p>
                  {item.variant ? (
                    <p className="truncate text-xs font-semibold text-petal-deep">
                      {item.variant}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-bold tabular-nums text-ink">
                  {item.priceRub * item.qty} ₽
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-blush pt-3">
            <span className="font-bold">Итого</span>
            <span className="font-extrabold tabular-nums">
              {order.totalRub} ₽
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {isOwnerView ? (
            <ButtonLink href="/profile/orders" size="lg">
              <PackageCheck className="size-5" aria-hidden />
              Мои заказы
            </ButtonLink>
          ) : null}
          <ButtonLink
            href="/shop"
            variant={isOwnerView ? "secondary" : "primary"}
            size="lg"
          >
            <ShoppingBag className="size-5" aria-hidden />
            Продолжить покупки
          </ButtonLink>
        </div>

        {!isOwnerView ? (
          <p className="mt-4 text-xs text-ink-soft">
            Сохрани ссылку на эту страницу — это номер твоего заказа. По нему
            вернёшься к деталям в любой момент.
          </p>
        ) : null}
      </div>
    </Container>
  );
}
