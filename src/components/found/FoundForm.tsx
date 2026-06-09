"use client";

import { useState } from "react";
import { Camera, Home, List, PawPrint } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { LeafletMap } from "@/components/map/LeafletMap";
import { postJson } from "@/lib/http";
import { dHash } from "@/lib/imghash";
import { districtsByOkrug } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";

export type FoundDefaults = {
  finderName?: string | null;
  contactPhone?: string | null;
  contactTelegram?: string | null;
};

export function FoundForm({ defaults }: { defaults?: FoundDefaults }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [district, setDistrict] = useState("");
  const [comment, setComment] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [finderName, setFinderName] = useState(defaults?.finderName ?? "");
  const [contactPhone, setContactPhone] = useState(defaults?.contactPhone ?? "");
  const [contactTelegram, setContactTelegram] = useState(
    defaults?.contactTelegram ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка фото с уменьшением (как в PetWizard) — чтобы не хранить мегабайты.
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhoto(canvas.toDataURL("image/jpeg", 0.82));
        } else {
          setPhoto(src);
        }
      };
      img.onerror = () => setPhoto(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const photoHash = photo ? await dHash(photo) : null;
      await postJson<{ id: string }>("/api/found", {
        finderName: finderName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactTelegram: contactTelegram.trim() || null,
        photo,
        photoHash,
        breed: breed.trim() || null,
        color: color.trim() || null,
        size: size || null,
        district: district || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        comment: comment.trim() || null,
      });
      setDone(true);
    } catch {
      setError("Не удалось опубликовать находку. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <SuccessNote className="mb-3">Находка опубликована</SuccessNote>
        <h1 className="text-3xl font-bold sm:text-4xl">Спасибо, ты герой! 🐾</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Находка попала в общую ленту, а владельцы пропавших собак из этого
          района уже получили уведомление. Вместе вернём собаку домой!
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/found" size="lg">
            <List className="size-5" aria-hidden />
            К ленте находок
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            <Home className="size-5" aria-hidden />
            На главную
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <Field label="Фото найденной собаки" hint="По фото хозяин узнает её быстрее всего">
          {photo ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative aspect-square w-56 overflow-hidden rounded-3xl border-4 border-card shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Найденная собака"
                  className="size-full object-cover"
                />
              </div>
              <label className="cursor-pointer text-sm font-semibold text-petal-deep hover:underline">
                Заменить фото
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhoto}
                />
              </label>
            </div>
          ) : (
            <label className="mx-auto flex aspect-square w-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-blush bg-blush-soft/50 text-ink-soft transition-colors hover:border-petal hover:text-petal-deep">
              <Camera className="size-9" aria-hidden />
              <span className="text-sm font-semibold">Загрузить фото</span>
              <span className="px-6 text-center text-xs">
                Можно сделать прямо с камеры
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPhoto}
              />
            </label>
          )}
        </Field>

        <Field label="Порода" hint="Если не знаешь — оставь пустым или напиши «метис»">
          <Input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Например, метис / лабрадор"
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
            <option value="">Выбери район…</option>
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

        <Field
          label="Где именно нашли?"
          hint={
            coords
              ? "📍 Точка отмечена — можно поправить кликом по карте"
              : "Ткни точку на карте, где встретил(а) собаку"
          }
        >
          <LeafletMap
            picker
            picked={coords}
            onPick={(lat, lng) => setCoords({ lat, lng })}
            center={coords ? [coords.lat, coords.lng] : undefined}
            height={300}
          />
        </Field>

        <Field label="Комментарий" hint="Поведение, ошейник, особые приметы, где сейчас собака">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Бегала у метро без поводка, дружелюбная, в синем ошейнике…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Как тебя зовут">
            <Input
              value={finderName}
              onChange={(e) => setFinderName(e.target.value)}
              placeholder="Имя"
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
        </div>

        <Field label="Telegram" hint="Хозяин сможет написать тебе">
          <Input
            value={contactTelegram}
            onChange={(e) => setContactTelegram(e.target.value)}
            placeholder="@username"
          />
        </Field>

        <ErrorBox message={error} />

        <Button size="lg" onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Публикую…" : "Опубликовать находку"}
          {!submitting ? <PawPrint className="size-5" aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
