/** Базовый URL сайта для абсолютных ссылок (OG, sitemap, JSON-LD). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapka-pomoshchi.ru";

/** Абсолютная ссылка из относительного пути (уже-абсолютные не трогаем). */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;
}
