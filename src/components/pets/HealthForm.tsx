"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { postJson } from "@/lib/http";

// Типы записей в порядке для селекта (значение → подпись).
const typeOptions = [
  { value: "vaccine", label: "💉 Прививка" },
  { value: "deworming", label: "🪱 Обработка от паразитов" },
  { value: "weight", label: "⚖️ Вес" },
  { value: "treatment", label: "🏥 Лечение" },
  { value: "other", label: "📋 Другое" },
] as const;

/** Сегодняшняя дата в формате YYYY-MM-DD для <input type="date">. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HealthForm({ petId }: { petId: string }) {
  const router = useRouter();

  const [type, setType] = useState<string>("vaccine");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [nextDue, setNextDue] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Поля «следующая дата» и «значение» полезны не для всех типов —
  // подсказываем уместность, но не запрещаем.
  const showNextDue = type === "vaccine" || type === "deworming";
  const showValue = type === "weight";

  const reset = () => {
    setTitle("");
    setDate(today());
    setNextDue("");
    setValue("");
    setNote("");
  };

  const submit = async () => {
    if (saving) return;
    if (!title.trim()) {
      setError("Укажите название записи");
      return;
    }
    if (!date) {
      setError("Укажите дату");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await postJson("/api/health", {
        petId,
        type,
        title: title.trim(),
        date,
        nextDue: nextDue || undefined,
        value: value.trim() || undefined,
        note: note.trim() || undefined,
      });
      setSaved(true);
      reset();
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось сохранить. Попробуй ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      <div>
        <h2 className="text-lg font-bold text-ink">Новая запись</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Прививка, обработка, вес или визит к ветеринару — всё в одном месте.
        </p>
      </div>

      <Field label="Тип записи" required>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Название" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Бешенство (Нобивак), капли Адвокат…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Дата" required>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field
          label="Следующая дата"
          hint={
            showNextDue
              ? "Когда повторить — напомним заранее"
              : "Необязательно"
          }
        >
          <Input
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Значение"
        hint={showValue ? "Например, «9.8 кг»" : "Необязательно"}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={showValue ? "9.8 кг" : "Доза, партия, результат…"}
        />
      </Field>

      <Field label="Заметка" hint="Необязательно">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Как перенёс, рекомендации ветеринара…"
        />
      </Field>

      <div className="flex flex-col items-stretch gap-2 pt-1">
        <Button size="lg" onClick={submit} disabled={saving}>
          <PawPrint className="size-5" aria-hidden />
          {saving ? "Сохраняю…" : "Добавить запись"}
        </Button>
        {error ? <ErrorBox message={error} /> : null}
        {saved && !error ? (
          <SuccessNote variant="block">Запись добавлена!</SuccessNote>
        ) : null}
      </div>
    </div>
  );
}
