import { ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { buildCartLines, readCart, readVariants } from "@/components/shop/cart-cookie";
import { loadVariantDeltaIndex, linePriceWithVariant } from "@/lib/variant-pricing";
import { CartLine } from "@/components/shop/CartLine";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Корзина" };

export default async function CartPage() {
  const cart = await readCart();
  const variants = await readVariants();
  const ids = Object.keys(cart);

  const products = ids.length
    ? await db.product.findMany({ where: { id: { in: ids } } })
    : [];

  // Сохраняем порядок и считаем сумму по актуальным ценам С УЧЁТОМ выбранных
  // вариантов (общий с чекаутом хелпер) — иначе превью корзины расходится
  // с фактическим списанием при платных опциях (размер/цвет).
  const lines = buildCartLines(products, cart);
  const deltaIndex = await loadVariantDeltaIndex(ids);
  const linePrices = new Map(
    lines.map((l) => [
      l.product.id,
      linePriceWithVariant(deltaIndex, l.product.id, l.product.priceRub, variants[l.product.id]),
    ]),
  );
  const total = lines.reduce(
    (sum, l) => sum + (linePrices.get(l.product.id) ?? l.product.priceRub) * l.qty,
    0,
  );
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const user = await getCurrentUser();

  if (lines.length === 0) {
    return (
      <Container className="py-12 sm:py-16">
        <Badge tone="petal">🛒 Корзина</Badge>
        <h1 className="mb-8 mt-3 text-3xl font-bold sm:text-4xl">Корзина</h1>
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Корзина пока пустая. Пойдём выберем адресник — я помогу!" />
          <div className="mt-6">
            <ButtonLink href="/shop" size="lg">
              <ShoppingBag className="size-5" aria-hidden />
              В магазин
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="petal">🛒 Корзина</Badge>
      <h1 className="mb-8 mt-3 text-3xl font-bold sm:text-4xl">Корзина</h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Позиции */}
        <div className="rounded-3xl border border-blush bg-card p-4 shadow-card sm:p-6">
          <div className="divide-y divide-blush">
            {lines.map((l) => (
              <CartLine
                key={l.product.id}
                productId={l.product.id}
                slug={l.product.slug}
                name={l.product.name}
                image={l.product.image}
                priceRub={linePrices.get(l.product.id) ?? l.product.priceRub}
                qty={l.qty}
                variant={variants[l.product.id]}
              />
            ))}
          </div>
        </div>

        {/* Итог + оформление */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
            <div className="flex items-center justify-between text-ink-soft">
              <span>Товаров</span>
              <span className="font-semibold tabular-nums">{itemCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-blush pt-3 text-lg">
              <span className="font-bold">Итого</span>
              <span className="font-extrabold tabular-nums">{total} ₽</span>
            </div>
          </div>

          <CheckoutForm
            defaultName={user?.name ?? ""}
            defaultPhone={user?.phone ?? ""}
          />
        </div>
      </div>
    </Container>
  );
}
