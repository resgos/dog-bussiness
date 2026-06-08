// Шаги плейбука поиска (синхронизированы с гайдом /guide/lost).
export type SearchStep = { key: string; label: string; hint?: string };
export const SEARCH_STEPS: SearchStep[] = [
  { key: "yard", label: "Обыскал двор, подъезды и укрытия рядом", hint: "Под крыльцом, в кустах, гаражах, подвалах" },
  { key: "beacons", label: "Оставил дома еду и пахнущую вещь", hint: "Знакомый запах приводит собаку обратно" },
  { key: "routes", label: "Прошёл знакомые маршруты прогулок" },
  { key: "poster", label: "Расклеил плакаты у подъездов и магазинов" },
  { key: "vets", label: "Обзвонил ветклиники района" },
  { key: "shelters", label: "Лично проверил приюты" },
  { key: "chip", label: "Проверил чип-реестр" },
  { key: "social", label: "Опубликовал в районных чатах и соцсетях" },
  { key: "reward", label: "Назначил вознаграждение" },
];
export const SEARCH_STEP_KEYS = SEARCH_STEPS.map((s) => s.key);
/** Безопасно парсит LostReport.checklist (JSON-массив ключей). */
export function parseChecklist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((k): k is string => typeof k === "string" && SEARCH_STEP_KEYS.includes(k)) : [];
  } catch {
    return [];
  }
}
