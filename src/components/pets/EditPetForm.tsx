"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PhotoManager } from "./PhotoManager";
import { districtsByOkrug } from "@/lib/districts";
import { ageOptions, sizeOptions } from "@/lib/petForm";

export type EditablePet = {
  id: string;
  name: string;
  breed: string | null;
  sex: string | null;
  age: string | null;
  size: string | null;
  color: string | null;
  district: string | null;
  ownerPhone: string | null;
  telegram: string | null;
  showPhone: boolean;
  marksText: string | null;
  chip: string | null;
  status: string;
  photos?: { id: string; url: string }[];
};

const statusOptions = [
  { value: "home", label: "🏠 Дома" },
  { value: "lost", label: "🚨 Потерялась" },
  { value: "found", label: "✅ Нашлась" },
] as const;

export function EditPetForm({ pet }: { pet: EditablePet }) {
  const router = useRouter();

  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed ?? "");
  const [sex, setSex] = useState(pet.sex ?? "");
  const [age, setAge] = useState(pet.age ?? "");
  const [size, setSize] = useState(pet.size ?? "");
  const [color, setColor] = useState(pet.color ?? "");
  const [district, setDistrict] = useState(pet.district ?? "");
  const [ownerPhone, setOwnerPhone] = useState(pet.ownerPhone ?? "");
  const [telegram, setTelegram] = useState(pet.telegram ?? "");
  const [showPhone, setShowPhone] = useState(pet.showPhone);
  const [marksText, setMarksText] = useState(pet.marksText ?? "");
  const [chip, setChip] = useState(pet.chip ?? "");
  const [status, setStatus] = useState(pet.status || "home");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (saving) return;
    if (!name.trim()) {
      setError("Кличка обязательна");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          breed,
          sex,
          age,
          size,
          color,
          district,
          ownerPhone,
          telegram,
          showPhone,
          marksText,
          chip,
          status,
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

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/profile/pets");
      router.refresh();
    } catch {
      setError("Не удалось удалить питомца. Попробуй ещё раз.");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <ShunyaBubble
        message={`Подправим карточку «${pet.name}»? Меняй что нужно — я запомню.`}
        className="mb-8"
      />

      <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <Field label="Кличка" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Шуня"
          />
        </Field>

        <Field label="Порода">
          <Input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Корги, метис…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Пол">
            <div className="flex gap-2">
              <TagToggle active={sex === "male"} onClick={() => setSex("male")}>
                Мальчик
              </TagToggle>
              <TagToggle
                active={sex === "female"}
                onClick={() => setSex("female")}
              >
                Девочка
              </TagToggle>
            </div>
          </Field>

          <Field label="Возраст">
            <Select value={age} onChange={(e) => setAge(e.target.value)}>
              <option value="">Не указан</option>
              {ageOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

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

        <Field label="Окрас">
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Рыжий с белой грудкой"
          />
        </Field>

        <Field label="Район проживания" hint="По нему соседи находят пропажи рядом">
          <Select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
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

        <Field label="Особые приметы" hint="Любые приметы, по которым его узнают">
          <Textarea
            value={marksText}
            onChange={(e) => setMarksText(e.target.value)}
            placeholder="Шрам на ухе, белый кончик хвоста…"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink">
            Фотогалерея
          </span>
          <PhotoManager petId={pet.id} initial={pet.photos ?? []} />
        </div>

        <Field
          label="Номер микрочипа"
          hint="15 цифр, сканируется в любой ветклинике — помогает вернуть собаку"
        >
          <Input
            inputMode="numeric"
            value={chip}
            onChange={(e) => setChip(e.target.value)}
            placeholder="643..."
          />
        </Field>

        <Field label="Контактный телефон">
          <Input
            type="tel"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
        </Field>

        <Field label="Telegram">
          <Input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
          />
        </Field>

        <Field label="Статус">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Checkbox
          label="Показывать мой телефон на публичной странице паспорта питомца"
          checked={showPhone}
          onChange={(e) => setShowPhone(e.target.checked)}
        />

        <div className="flex flex-col items-stretch gap-2 pt-1">
          <Button size="lg" onClick={save} disabled={saving}>
            <PawPrint className="size-5" aria-hidden />
            {saving ? "Сохраняю…" : "Сохранить изменения"}
          </Button>
          {error ? <ErrorBox message={error} /> : null}
          {saved && !error ? (
            <SuccessNote variant="block">Сохранено!</SuccessNote>
          ) : null}
        </div>
      </div>

      {/* Опасная зона — удаление питомца */}
      <div className="mt-8 rounded-3xl border border-status-lost/30 bg-card p-6 shadow-card sm:p-7">
        <h2 className="text-base font-bold text-status-lost-ink">
          Удалить питомца
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Карточка и публичный паспорт исчезнут безвозвратно.
        </p>

        {!confirmDel ? (
          <div className="mt-4">
            <Button
              variant="sos-outline"
              onClick={() => setConfirmDel(true)}
              disabled={deleting}
            >
              <Trash2 className="size-4" aria-hidden />
              Удалить питомца
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-status-lost/30 bg-status-lost/5 p-4">
            <p className="text-sm font-semibold text-status-lost-ink">
              Точно удалить «{pet.name}»? Это нельзя отменить.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="sos" onClick={remove} disabled={deleting}>
                <Trash2 className="size-4" aria-hidden />
                {deleting ? "Удаляю…" : "Да, удалить"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmDel(false)}
                disabled={deleting}
              >
                <X className="size-4" aria-hidden />
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
