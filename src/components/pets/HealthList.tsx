"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bug,
  CalendarClock,
  ClipboardList,
  Scale,
  Stethoscope,
  Syringe,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/** Запись дневника в виде, безопасном для передачи в client (даты — ISO-строки). */
export type HealthRecordView = {
  id: string;
  type: string;
  title: string;
  date: string;
  nextDue: string | null;
  value: string | null;
  note: string | null;
};

type TypeMeta = {
  label: string;
  icon: LucideIcon;
  tone: "petal" | "paw" | "found" | "seen" | "neutral";
};

// Метаданные по типу записи: подпись, иконка, тон бейджа.
const typeMeta: Record<string, TypeMeta> = {
  vaccine: { label: "Прививка", icon: Syringe, tone: "petal" },
  deworming: { label: "Обработка", icon: Bug, tone: "paw" },
  weight: { label: "Вес", icon: Scale, tone: "seen" },
  treatment: { label: "Лечение", icon: Stethoscope, tone: "found" },
  other: { label: "Другое", icon: ClipboardList, tone: "neutral" },
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU").format(new Date(iso));

/** Кол-во полных дней от сегодня (по дате, без времени) до целевой даты. */
function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/** Цвет и подпись строки «Следующая» по сроку nextDue. */
function nextDueStatus(iso: string): { className: string; suffix: string } {
  const d = daysUntil(iso);
  if (d < 0) {
    return { className: "text-status-lost", suffix: "просрочено" };
  }
  if (d <= 30) {
    return {
      className: "text-coral",
      suffix: d === 0 ? "сегодня" : `через ${d} дн.`,
    };
  }
  return { className: "text-ink-soft", suffix: "" };
}

function HealthCard({ record }: { record: HealthRecordView }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = typeMeta[record.type] ?? typeMeta.other;
  const Icon = meta.icon;
  const next = record.nextDue ? nextDueStatus(record.nextDue) : null;

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/health/${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Не удалось удалить. Попробуй ещё раз.");
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-3xl border border-blush bg-card p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
          <Icon className="size-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className="text-sm text-ink-soft">{fmtDate(record.date)}</span>
            {record.value ? (
              <span className="text-sm font-semibold text-ink">
                {record.value}
              </span>
            ) : null}
          </div>

          <h3 className="mt-1.5 font-bold text-ink">{record.title}</h3>

          {record.note ? (
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
              {record.note}
            </p>
          ) : null}

          {next ? (
            <p
              className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold ${next.className}`}
            >
              <CalendarClock className="size-4" aria-hidden />
              Следующая: {fmtDate(record.nextDue as string)}
              {next.suffix ? ` · ${next.suffix}` : ""}
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-2 text-sm font-medium text-status-lost"
            >
              {error}
            </p>
          ) : null}
        </div>

        {!confirm ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Удалить запись"
            className="shrink-0 rounded-full p-2 text-ink-soft transition-colors hover:bg-status-lost/10 hover:text-status-lost"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {confirm ? (
        <div className="mt-4 rounded-2xl border border-status-lost/30 bg-status-lost/5 p-4">
          <p className="text-sm font-semibold text-status-lost-ink">
            Удалить «{record.title}»? Это нельзя отменить.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="sos" size="sm" onClick={remove} disabled={deleting}>
              <Trash2 className="size-4" aria-hidden />
              {deleting ? "Удаляю…" : "Да, удалить"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm(false)}
              disabled={deleting}
            >
              <X className="size-4" aria-hidden />
              Отмена
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function HealthList({ records }: { records: HealthRecordView[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-blush bg-card/60 p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blush-soft text-petal-deep">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <p className="mt-3 font-semibold text-ink">Пока записей нет</p>
        <p className="mt-1 text-sm text-ink-soft">
          Добавьте первую прививку, обработку или вес — и я буду напоминать о
          сроках.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {records.map((r) => (
        <HealthCard key={r.id} record={r} />
      ))}
    </ul>
  );
}
