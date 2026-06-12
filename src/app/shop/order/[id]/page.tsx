import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { timeAgo } from "@/lib/format";

// Статус заказа меняется (new → processing → done) — всегда свежие данные.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Заказ принят" };

const STATUS_RU: Record<string, string> = {
  new: "принят",
  processing: "собираем",
  done: "выполнен",
};

type Params = { params: Promise<{ id: string }> };

/**
 * Подтверждение заказа после чекаута. Без контактных данных покупателя (PII):
 * страница доступна по непереборному cuid-id и для гостевых заказов — показываем
 * только номер, состав и сумму. Контакты видны владельцу в /profile/orders.
 */
export default async function OrderConfirmationPage({ params }: Params) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const shortNo = order.id.slice(0, 8);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-blush bg-card p-8 text-center shadow-card sm:p-10">
        <SuccessNote className="mb-3">
          Заказ {STATUS_RU[order.status] ?? "принят"}
        </SuccessNote>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Спасибо! Уже мчим за заказом 🐾
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Заказ{" "}
          <span className="font-mono font-semibold text-ink">{`#${shortNo}`}</span>{" "}
          оформлен {timeAgo(order.createdAt)}. Мы свяжемся с тобой по телефону
          для подтверждения и доставки.
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
          <ButtonLink href="/profile/orders" size="lg">
            <PackageCheck className="size-5" aria-hidden />
            Мои заказы
          </ButtonLink>
          <ButtonLink href="/shop" variant="secondary" size="lg">
            <ShoppingBag className="size-5" aria-hidden />
            Продолжить покупки
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
