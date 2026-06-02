import { PawPrint } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";

/** Сетка карточек товаров + пустое состояние. */
export function CatalogGrid({
  products,
  emptyText = "Пока тут пусто — товары скоро появятся!",
}: {
  products: ProductCardData[];
  emptyText?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-blush bg-card p-12 text-center shadow-card">
        <PawPrint className="size-10 text-petal" aria-hidden />
        <p className="text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
