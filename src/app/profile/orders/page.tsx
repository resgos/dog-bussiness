import Link from "next/link";
import { PawPrint, PackageCheck, LogIn, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои заказы" };

const statusMeta: Record<
  string,
  { label: string; tone: "neutral" | "petal" | "found" }
> = {
  new: { label: "Новый", tone: "petal" },
  processing: { label: "В обработке", tone: "neutral" },
  done: { label: "Выполнен", tone: "found" },
};

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Container className="py-12 sm:py-16">
        <Badge tone="petal">📦 Заказы</Badge>
        <h1 className="mb-8 mt-3 text-3xl font-bold sm:text-4xl">Мои заказы</h1>
        <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <PackageCheck className="mx-auto size-12 text-petal" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Войдите, чтобы видеть заказы</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            История заказов привязана к аккаунту. Войди или зарегистрируйся —
            и все твои адресники будут под рукой.
          </p>
          <div className="mt-6">
            <ButtonLink href="/auth" size="lg">
              <LogIn className="size-5" aria-hidden />
              Войти
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="petal">📦 Заказы</Badge>
      <h1 className="mb-8 mt-3 text-3xl font-bold sm:text-4xl">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <PawPrint className="mx-auto size-12 text-petal" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Заказов пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Самое время выбрать адресник с QR-кодом для своего хвостатого.
          </p>
          <div className="mt-6">
            <ButtonLink href="/shop" size="lg">
              В магазин
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const status = statusMeta[order.status] ?? statusMeta.new;
            return (
              <div
                key={order.id}
                className="rounded-3xl border border-blush bg-card p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blush pb-4">
                  <div>
                    {/* Карточка ведёт на страницу заказа — там же приземляется
                        покупатель сразу после чекаута (/shop/order/[id]). */}
                    <Link
                      href={`/shop/order/${order.id}`}
                      className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-ink hover:text-petal-deep hover:underline"
                    >
                      {`Заказ #${order.id.slice(0, 8)}`}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>

                <ul className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink">
                        {item.product.name}
                        <span className="text-ink-soft"> × {item.qty}</span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-ink">
                        {item.priceRub * item.qty} ₽
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-blush pt-4">
                  <span className="font-bold">Итого</span>
                  <span className="text-lg font-extrabold tabular-nums">
                    {order.totalRub} ₽
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
