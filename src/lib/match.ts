// Эвристический матчинг «потерялась ↔ нашлась» по приметам, району и времени.
// Без внешней ML — взвешенная сумма признаков (0–100). Это «умный матчинг»
// уровня MVP; апгрейд до CV-эмбеддингов по фото — следующий шаг.

type LostLike = {
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  district?: string | null;
  lostAt?: Date | string | null;
  createdAt?: Date | string | null;
};
type FoundLike = {
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  district?: string | null;
  createdAt?: Date | string | null;
};

const norm = (s?: string | null) =>
  (s || "").toLowerCase().replace(/ё/g, "е").trim();
// Стоп-слова из вольного описания — не должны давать «совпадение».
const STOP = new Set([
  "не", "знаю", "нет", "или", "около", "примерно", "возможно",
  "похож", "похожа", "похожий", "цвет", "окрас", "порода", "размер", "средний",
]);
const tokens = (s?: string | null) =>
  norm(s)
    .split(/[\s,/.-]+/)
    .filter((t) => t.length >= 4 && !STOP.has(t));

function overlap(a?: string | null, b?: string | null): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return false;
  return ta.some((t) => tb.some((u) => t === u || t.includes(u) || u.includes(t)));
}

/** 0–100: насколько находка похожа на пропажу. */
export function matchScore(lost: LostLike, found: FoundLike): number {
  let s = 0;
  if (lost.district && found.district && lost.district === found.district) s += 40;
  if (overlap(lost.breed, found.breed)) s += 25;
  if (overlap(lost.color, found.color)) s += 20;
  if (lost.size && found.size && lost.size === found.size) s += 10;
  // Время: находка не сильно раньше пропажи и в пределах ~21 дня.
  const lt = lost.lostAt ?? lost.createdAt;
  const ft = found.createdAt;
  if (lt && ft) {
    const days =
      (new Date(ft).getTime() - new Date(lt).getTime()) / 86_400_000;
    if (days >= -1 && days <= 21) s += 10;
  }
  return Math.min(100, s);
}

/** Ранжированные находки для пропажи (по убыванию совпадения, выше порога). */
export function rankFoundForLost<T extends FoundLike>(
  lost: LostLike,
  founds: T[],
  min = 40,
): { item: T; score: number }[] {
  return founds
    .map((item) => ({ item, score: matchScore(lost, item) }))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score);
}

/** Ранжированные пропажи для находки (обратное направление). */
export function rankLostForFound<T extends LostLike>(
  found: FoundLike,
  losts: T[],
  min = 40,
): { item: T; score: number }[] {
  return losts
    .map((item) => ({ item, score: matchScore(item, found) }))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score);
}
