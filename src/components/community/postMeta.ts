import type { ComponentProps } from "react";
import type { Badge } from "@/components/ui/Badge";

type Tone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

export type PostType =
  | "пропажа"
  | "находка"
  | "наблюдение"
  | "совет"
  | "событие"
  | "обсуждение";

/** Типы постов в порядке отображения в фильтре. */
export const POST_TYPES: PostType[] = [
  "пропажа",
  "находка",
  "наблюдение",
  "совет",
  "событие",
  "обсуждение",
];

/** Подпись + эмодзи + тон бейджа по смыслу типа поста. */
export const postTypeMeta: Record<PostType, { label: string; emoji: string; tone: Tone }> = {
  пропажа: { label: "Пропажа", emoji: "🔴", tone: "lost" },
  находка: { label: "Находка", emoji: "🟢", tone: "found" },
  наблюдение: { label: "Наблюдение", emoji: "👀", tone: "seen" },
  совет: { label: "Совет", emoji: "💡", tone: "paw" },
  событие: { label: "Событие", emoji: "📅", tone: "petal" },
  обсуждение: { label: "Обсуждение", emoji: "💬", tone: "neutral" },
};

/** Метаданные роли пользователя для бейджа в рейтинге. */
export const roleMeta: Record<string, { label: string; emoji: string; tone: Tone }> = {
  user: { label: "Сосед", emoji: "🐾", tone: "neutral" },
  volunteer: { label: "Волонтёр", emoji: "🦮", tone: "found" },
  ambassador: { label: "Амбассадор", emoji: "⭐", tone: "petal" },
  partner: { label: "Партнёр", emoji: "🤝", tone: "paw" },
};

export function roleInfo(role: string) {
  return roleMeta[role] ?? roleMeta.user;
}
