import { Suspense } from "react";
import { ScanLine } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { CatalogGrid } from "@/components/shop/CatalogGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Магазин" };

// Загрузку каталога выносим в дочерний async-компонент под inline <Suspense>, а
// НЕ в segment loading.tsx: иначе Suspense-граница сегмента отдаёт shell со
// статусом 200 раньше, чем дочерняя /shop/product/[slug] вызовет notFound() →
// soft-404. Витрина и товары — в sitemap, поэтому корректный 404 важен.
async function Catalog() {
  const products = await getCatalog();
  return <CatalogGrid products={products} />;
}

function CatalogSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-3xl border border-blush bg-blush-soft/60"
        />
      ))}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Container className="py-12 sm:py-16">
      {/* Тёплый hero с Шуней */}
      <div className="mb-8 overflow-hidden rounded-[2.5rem] border border-blush bg-gradient-to-br from-blush-soft to-card p-6 shadow-soft sm:p-8">
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

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog />
      </Suspense>
    </Container>
  );
}
