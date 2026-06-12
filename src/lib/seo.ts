/** Базовый URL сайта для абсолютных ссылок (OG, sitemap, JSON-LD). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

/** Абсолютная ссылка из относительного пути (уже-абсолютные не трогаем). */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;
}

/** JSON-LD «хлебные крошки» (schema.org BreadcrumbList) для богатой выдачи. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
