/** Базовый URL сайта для абсолютных ссылок (OG, sitemap, JSON-LD). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

/** Абсолютная ссылка из относительного пути (уже-абсолютные не трогаем). */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;
}

/**
 * JSON-LD карточки публичного объявления (schema.org Article) — единый билдер
 * для /lost, /found и паспорта /p (раньше объект дублировался по страницам).
 * Картинка — относительный путь к OG-карточке (превратим в абсолютный URL).
 */
export function articleLd(opts: {
  headline: string;
  description: string;
  imagePath: string;
  urlPath: string;
  datePublished: Date | string;
  dateModified?: Date | string;
  districtName?: string | null;
}) {
  const iso = (d: Date | string) => new Date(d).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    image: [absoluteUrl(opts.imagePath)],
    datePublished: iso(opts.datePublished),
    dateModified: iso(opts.dateModified ?? opts.datePublished),
    url: absoluteUrl(opts.urlPath),
    ...(opts.districtName
      ? { contentLocation: { "@type": "Place", name: `${opts.districtName}, Москва` } }
      : {}),
    publisher: { "@type": "Organization", name: "Лапка помощи" },
  };
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
