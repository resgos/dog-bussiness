"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { districtsByOkrug } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";

export type EditableReport = {
  id: string;
  petName: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  district: string | null;
  reward: number | null;
  comment: string | null;
};

/** Редактирование своего активного объявления о пропаже. PUT /api/reports/{id}. */
export function LostReportEditForm({ report }: { report: EditableReport }) {
  const router = useRouter();
  const [petName, setPetName] = useState(report.petName);
  const [breed, setBreed] = useState(report.breed ?? "");
  const [color, setColor] = useState(report.color ?? "");
  const [size, setSize] = useState(report.size ?? "");
  const [district, setDistrict] = useState(report.district ?? "");
  const [reward, setReward] = useState(report.reward ? String(report.reward) : "");
  const [comment, setComment] = useState(report.comment ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving) return;
    if (!petName.trim()) {
      setError("Кличка обязательна");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const rewardNum = Number(reward);
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petName,
          breed,
          color,
          size,
          district,
          reward: Number.isFinite(rewardNum) && rewardNum > 0 ? rewardNum : null,
          comment,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } catch {
      setError("Не удалось сохранить. Попробуй ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <ShunyaBubble
        message={`Поправим объявление о ${report.petName}? Обнови приметы или добавь награду — так найдут быстрее.`}
        className="mb-8"
      />

      <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <Field label="Кличка" required>
          <Input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Например, Тиша"
          />
        </Field>

        <Field label="Порода">
          <Input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Корги, метис…"
          />
        </Field>

        <Field label="Окрас">
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Рыжий с белой грудкой"
          />
        </Field>

        <Field label="Размер">
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">Не указан</option>
            {sizeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Район пропажи" hint="По нему соседи находят пропажи рядом">
          <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">Не выбран</option>
            {Object.entries(districtsByOkrug()).map(([okrug, list]) => (
              <optgroup key={okrug} label={okrug}>
                {list.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.pilot ? " ⭐ пилот" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="Награда, ₽" hint="Необязательно — но повышает отклик">
          <Input
            inputMode="numeric"
            value={reward}
            onChange={(e) => setReward(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Например, 5000"
          />
        </Field>

        <Field
          label="Приметы и обстоятельства"
          hint="Где и когда видели, особые приметы"
        >
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Убежал у парка, в синем ошейнике…"
          />
        </Field>

        <div className="flex flex-col items-stretch gap-2 pt-1">
          <Button size="lg" onClick={save} disabled={saving}>
            <Megaphone className="size-5" aria-hidden />
            {saving ? "Сохраняю…" : "Сохранить изменения"}
          </Button>
          {error ? <ErrorBox message={error} /> : null}
          {saved && !error ? (
            <SuccessNote variant="block">Сохранено!</SuccessNote>
          ) : null}
        </div>
      </div>
    </div>
  );
}
