/**
 * Человекочитаемые каналы монетизации (Purchase.kind) — единый источник для
 * витрины экономики (/pulse) и «Моих покупок» в профиле.
 */
export const PURCHASE_LABELS: Record<string, string> = {
  boost: "🚀 Продвижение объявлений",
  plus: "⭐ Подписка «Лапка+»",
  partner: "🤝 Партнёрские размещения",
  "poster-service": "🚚 Расклейка плакатов",
  "reward-donation": "💝 Донат на награду",
};

export function purchaseLabel(kind: string): string {
  return PURCHASE_LABELS[kind] ?? kind;
}
