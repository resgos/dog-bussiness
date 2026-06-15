import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Видимые «хлебные крошки» — навигация и ориентация для гостей, попавших на
 * детальную страницу прямо из поиска. Кормится тем же массивом, что и
 * breadcrumbLd (schema.org BreadcrumbList) — единый источник, видимое и
 * структурированное всегда совпадают. Последний элемент — текущая страница
 * (не ссылка, aria-current="page").
 */
export function Breadcrumbs({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.path} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-ink-soft/50"
                  aria-hidden
                />
              ) : null}
              {last ? (
                <span
                  aria-current="page"
                  className="max-w-[14rem] truncate font-semibold text-ink"
                >
                  {it.name}
                </span>
              ) : (
                <Link
                  href={it.path}
                  className="font-medium transition-colors hover:text-petal-deep hover:underline"
                >
                  {it.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
