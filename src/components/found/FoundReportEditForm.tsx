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

export type EditableFound = {
  id: string;
  finderName: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  breed: string | null;
  color: string | null;
  size: string | null;
  district: string | null;
  comment: string | null;
};

/** Редактирование своей находки нашедшим. PUT /api/found/{id}. */
export function FoundReportEditForm({ found }: { found: EditableFound }) {
  const router = useRouter();
  const [finderName, setFinderName] = useState(found.finderName ?? "");
  const [contactPhone, setContactPhone] = useState(found.contactPhone ?? "");
  const [contactTelegram, setContactTelegram] = useState(found.contactTelegram ?? "");
  const [breed, setBreed] = useState(found.breed ?? "");
  const [color, setColor] = useState(found.color ?? "");
  const [size, setSize] = useState(found.size ?? "");
  const [district, setDistrict] = useState(found.district ?? "");
  const [comment, setComment] = useState(found.comment ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/found/${found.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finderName,
          contactPhone,
          contactTelegram,
          breed,
          color,
          size,
          district,
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
        message="Поправим объявление о находке? Уточни приметы или контакты — так хозяин найдётся быстрее."
        className="mb-8"
      />

      <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
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

        <Field label="Район, где нашли">
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

        <Field label="Приметы и обстоятельства" hint="Где и при каких обстоятельствах нашли">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Подошла у метро, в красном ошейнике…"
          />
        </Field>

        <Field label="Ваше имя">
          <Input
            value={finderName}
            onChange={(e) => setFinderName(e.target.value)}
            placeholder="Как к вам обращаться"
          />
        </Field>

        <Field label="Телефон для связи">
          <Input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
        </Field>

        <Field label="Telegram">
          <Input
            value={contactTelegram}
            onChange={(e) => setContactTelegram(e.target.value)}
            placeholder="@username"
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
