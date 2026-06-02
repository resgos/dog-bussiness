/** Тоны бейджей из дизайн-системы (синхронно с @/components/ui/Badge). */
type Tone = "neutral" | "petal" | "paw" | "lost" | "found" | "seen";

/** Метаданные категорий товаров: подпись и тон бейджа. */
export const categoryMeta: Record<string, { label: string; tone: Tone }> = {
  addressniki: { label: "Адресник", tone: "petal" },
  bracelets: { label: "Браслет", tone: "paw" },
  merch: { label: "Мерч", tone: "neutral" },
  combo: { label: "Комбо", tone: "found" },
};

export function categoryLabel(category: string): string {
  return categoryMeta[category]?.label ?? category;
}

export function categoryTone(category: string): Tone {
  return categoryMeta[category]?.tone ?? "neutral";
}
