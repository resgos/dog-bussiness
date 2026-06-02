import { ScanLine } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { CatalogGrid } from "@/components/shop/CatalogGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Магазин" };

export default async function ShopPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      category: true,
      priceRub: true,
      image: true,
    },
  });

  return (
    <Container className="py-12 sm:py-16">
      {/* Тёплый hero с Шуней */}
      <div className="mb-10 overflow-hidden rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-8 shadow-soft sm:p-12">
        <Badge tone="petal">🛍️ Магазин</Badge>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
          Адресники с QR-кодом, браслеты и мерч с Шуней
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Каждый адресник ведёт на публичный паспорт питомца: наведи камеру —
          увидишь контакты хозяина. Сделано с любовью к хвостатым.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-petal-deep">
          <ScanLine className="size-5" aria-hidden />
          Сканируешь QR → сразу связь с хозяином
        </p>
        <div className="mt-6">
          <ShunyaBubble message="Выбирай адресник по вкусу — а я прослежу, чтобы тебя всегда вернули домой!" />
        </div>
      </div>

      <div className="mb-6">
        <CategoryNav active="all" />
      </div>

      <CatalogGrid products={products} />
    </Container>
  );
}
