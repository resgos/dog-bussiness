"use client";

import { useState } from "react";
import { Camera, Heart, Home, List } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { postJson } from "@/lib/http";
import { districtsByOkrug } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";

export type AdoptionDefaults = {
  contactName?: string | null;
  contactPhone?: string | null;
  contactTelegram?: string | null;
};

export function AdoptionForm({ defaults }: { defaults?: AdoptionDefaults }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [district, setDistrict] = useState("");
  const [story, setStory] = useState("");
  const [contactName, setContactName] = useState(defaults?.contactName ?? "");
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
    if (!name.trim()) {
      setError("Укажи кличку собаки — без неё объявление не опубликовать.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await postJson<{ id: string }>("/api/adoption", {
        name: name.trim(),
        breed: breed.trim() || null,
        age: age.trim() || null,
        size: size || null,
        color: color.trim() || null,
        photo,
        district: district || null,
        story: story.trim() || null,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactTelegram: contactTelegram.trim() || null,
      });
      setDone(true);
    } catch {
      setError("Не удалось разместить объявление. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <SuccessNote className="mb-3">Объявление опубликовано</SuccessNote>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Спасибо, что помогаешь! 🐾
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          {name.trim() ? `${name.trim()} уже` : "Собака уже"} в ленте
          пристройства. Будущие хозяева увидят объявление и смогут связаться с
          тобой. Пусть для хвостика поскорее найдётся тёплый дом!
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/adoption" size="lg">
            <List className="size-5" aria-hidden />
            К собакам на пристройство
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
        <Field
          label="Фото собаки"
          hint="Тёплое фото помогает найти дом в разы быстрее"
        >
          {photo ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative aspect-square w-56 overflow-hidden rounded-3xl border-4 border-card shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Собака на пристройство"
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

        <Field label="Кличка" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как зовут собаку"
          />
        </Field>

        <Field label="Порода" hint="Если не знаешь — оставь пустым или напиши «метис»">
          <Input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Например, метис / лабрадор"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Возраст">
            <Input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Например, 2 года"
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
        </div>

        <Field label="Окрас">
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Рыжий с белой грудкой"
          />
        </Field>

        <Field label="Район">
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
          label="История собаки"
          hint="Характер, привычки, ладит ли с детьми и животными, почему ищет дом"
        >
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Добрый и ласковый пёс, обожает прогулки, знает команды, ладит с детьми…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Контактное имя">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
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

        <Field label="Telegram" hint="Будущие хозяева смогут написать тебе">
          <Input
            value={contactTelegram}
            onChange={(e) => setContactTelegram(e.target.value)}
            placeholder="@username"
          />
        </Field>

        <ErrorBox message={error} />

        <Button size="lg" onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Публикую…" : "Разместить собаку"}
          {!submitting ? <Heart className="size-5" aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
