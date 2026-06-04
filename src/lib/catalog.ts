import { db } from "@/lib/db";

/** Единый набор полей карточки товара для всех витрин магазина. */
const catalogSelect = {
  slug: true,
  name: true,
  category: true,
  priceRub: true,
  image: true,
} as const;

/**
 * Товары каталога: все или отфильтрованные по категории, новые сверху.
 * Убирает дублирование findMany + select на страницах магазина.
 */
export function getCatalog(category?: string) {
  return db.product.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    select: catalogSelect,
  });
}
