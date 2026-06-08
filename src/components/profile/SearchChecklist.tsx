"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { SEARCH_STEPS } from "@/lib/searchSteps";
import { ErrorBox } from "@/components/ui/ErrorBox";

/**
 * Чек-лист поиска по конкретной пропаже. Виден только владельцу.
 * Оптимистично тикает шаги и сохраняет состояние в POST /api/checklist.
 */
export function SearchChecklist({
  reportId,
  petName,
  initial,
}: {
  reportId: string;
  petName: string;
  initial: string[];
}) {
  const [done, setDone] = useState<Set<string>>(new Set(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = SEARCH_STEPS.length;
  const pct = total === 0 ? 0 : Math.round((done.size / total) * 100);

  const save = async (next: Set<string>) => {
    const prev = done;
    // Оптимистично показываем новое состояние.
    setDone(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, steps: [...next] }),
      });
      if (!res.ok) throw new Error("save failed");
      setError(null);
    } catch {
      // Откатываем к прежнему состоянию и показываем ошибку.
      setDone(prev);
      setError("Не удалось сохранить. Попробуй ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) => {
    const next = new Set(done);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    void save(next);
  };

  return (
    <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      {/* Прогресс */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-ink">
            {done.size} из {total} шагов
          </p>
          {saving ? (
            <span className="text-xs text-ink-soft">Сохраняю…</span>
          ) : null}
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-blush-soft">
          <div
            className="h-full rounded-full bg-petal transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error ? <ErrorBox message={error} /> : null}

      {/* Список шагов */}
      <ul className="space-y-2" aria-label={`Шаги поиска · ${petName}`}>
        {SEARCH_STEPS.map((step) => {
          const checked = done.has(step.key);
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => toggle(step.key)}
                aria-pressed={checked}
                className="flex w-full items-start gap-3 rounded-2xl border border-blush bg-card px-4 py-3 text-left transition hover:bg-blush-soft"
              >
                {checked ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-petal"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="mt-0.5 size-5 shrink-0 text-ink-soft"
                    aria-hidden
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={
                      checked
                        ? "font-semibold text-petal-deep"
                        : "font-semibold text-ink"
                    }
                  >
                    {step.label}
                  </span>
                  {step.hint ? (
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {step.hint}
                    </span>
                  ) : null}
                </span>
              </button>

              {/* Полезные ссылки — отдельным элементом, не внутри кнопки. */}
              {step.key === "poster" ? (
                <Link
                  href={`/poster/${reportId}`}
                  className="mt-1 ml-12 inline-flex text-xs font-semibold text-petal-deep hover:underline"
                >
                  Открыть плакат →
                </Link>
              ) : null}
              {step.key === "chip" ? (
                <Link
                  href="/chip"
                  className="mt-1 ml-12 inline-flex text-xs font-semibold text-petal-deep hover:underline"
                >
                  Проверить чип →
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-ink-soft">
        Виден только тебе. Отмечай шаги — так ничего не упустишь.
      </p>
    </div>
  );
}
