// Единый источник правды по достижениям стаи (ТЗ 4.2).
// Здесь только определения и чистая математика прогресса — БД-запросы живут
// на странице, чтобы этот модуль можно было импортировать где угодно.

export type AchMetric = "pets" | "likes" | "helped" | "complete";

export type AchievementDef = {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  goal: number;
  metric: AchMetric;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "neighbor", emoji: "🐾", title: "Сосед", desc: "Добавил первого питомца в стаю", goal: 1, metric: "pets" },
  { key: "dossier", emoji: "📋", title: "Досье готово", desc: "Заполнил профиль питомца на 100%", goal: 1, metric: "complete" },
  { key: "soul", emoji: "💛", title: "Душа стаи", desc: "100 лайков на твоих постах", goal: 100, metric: "likes" },
  { key: "first_tail", emoji: "🐕", title: "Первый хвост", desc: "Помог найти первую собаку", goal: 1, metric: "helped" },
  { key: "tail_by_tail", emoji: "🦴", title: "Хвост за хвостом", desc: "Помог найти 5 собак", goal: 5, metric: "helped" },
  { key: "shunya_nose", emoji: "👃", title: "Нюх как у Шуни", desc: "Помог найти 10 собак", goal: 10, metric: "helped" },
];

export type AchStats = Record<AchMetric, number>;

export type AchievementState = AchievementDef & { have: number; earned: boolean; progress: number };

export function computeAchievements(stats: AchStats): AchievementState[] {
  return ACHIEVEMENTS.map((a) => {
    const have = stats[a.metric] ?? 0;
    return { ...a, have, earned: have >= a.goal, progress: Math.min(100, Math.round((have / a.goal) * 100)) };
  });
}

export function earnedCount(stats: AchStats): number {
  return computeAchievements(stats).filter((a) => a.earned).length;
}
