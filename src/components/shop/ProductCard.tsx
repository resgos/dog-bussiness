import Link from "next/link";
import { PawPrint, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel, categoryTone } from "./categories";

export type ProductCardData = {
  slug: string;
  name: string;
  category: string;
  priceRub: number;
  image: string | null;
};

/** Карточка товара в каталоге → ведёт на страницу товара. */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="relative aspect-square bg-blush-soft">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-petal">
            <PawPrint className="size-12" aria-hidden />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge tone={categoryTone(product.category)}>
            {categoryLabel(product.category)}
          </Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-bold leading-snug">{product.name}</h2>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-extrabold text-ink">
            {product.priceRub} ₽
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-petal-deep">
            Подробнее
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
