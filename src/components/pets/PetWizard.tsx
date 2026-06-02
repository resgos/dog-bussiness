"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  PawPrint,
  Plus,
  ShoppingBag,
  Trophy,
  X,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { districtsByOkrug } from "@/lib/districts";
import {
  STEPS,
  breedOptions,
  ageOptions,
  sizeOptions,
  markTags,
  temperamentTags,
  emptyPet,
  canProceed,
  completion,
  toggle,
  MARK_CHIP,
  type PetData,
} from "@/lib/petForm";

const poses = [
  "/shunya/pose-happy.png",
  "/shunya/pose-happy.png",
  "/shunya/pose-surprised.png",
  "/shunya/pose-sneaky.png",
  "/shunya/pose-grumpy.png",
  "/shunya/pose-happy.png",
];

export function PetWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<PetData>(emptyPet);
  const [spotDraft, setSpotDraft] = useState("");
  const [passportId, setPassportId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<PetData>) => setData((d) => ({ ...d, ...patch }));
  const total = STEPS.length;
  const proceedable = canProceed(step, data);

  // Загрузка фото с уменьшением (чтобы не хранить мегабайты в БД).
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = document.createElement("img");
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
          set({ photo: canvas.toDataURL("image/jpeg", 0.82) });
        } else {
          set({ photo: src });
        }
      };
      img.onerror = () => set({ photo: src });
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const addSpot = () => {
    const v = spotDraft.trim();
    if (v && data.walkSpots.length < 5) {
      set({ walkSpots: [...data.walkSpots, v] });
      setSpotDraft("");
    }
  };

  const next = async () => {
    if (!proceedable || submitting) return;
    if (step < total - 1) {
      setStep(step + 1);
      return;
    }
    // Финал — сохраняем питомца в БД.
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      const json = await res.json();
      setPassportId(json.id);
      setDone(true);
    } catch {
      setError("Не удалось сохранить. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://lapka-pomoshchi.ru";
    const url = `${origin}/p/${passportId}`;
    const percent = completion(data);
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-status-found/15 px-4 py-2 text-sm font-bold text-[#4f9e63]">
          <Check className="size-4" aria-hidden />
          Карточка «{data.name || "питомца"}» создана
        </div>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Ура! Теперь {data.name || "малыш"} — часть стаи 🐾
        </h1>

        <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-blush bg-card p-6 shadow-card">
          <div className="flex justify-center rounded-2xl bg-white p-4">
            <QRCodeSVG value={url} size={176} fgColor="#4a4a4a" bgColor="#ffffff" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">
            QR-код цифрового паспорта
          </p>
          <a
            href={`/p/${passportId}`}
            className="mt-1 inline-block text-xs text-petal-deep hover:underline"
          >
            Открыть публичную страницу паспорта →
          </a>
        </div>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <ButtonLink href="/shop/addressniki" size="lg">
            <ShoppingBag className="size-5" aria-hidden />
            Заказать адресник с QR
          </ButtonLink>
          <ButtonLink href="/profile/pets" variant="secondary" size="lg">
            Мои питомцы
          </ButtonLink>
        </div>

        <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-paw/20 p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Trophy className="size-4 text-coral" aria-hidden />
            Достижение «Сосед» получено!
          </p>
          <p className="mt-1.5 text-xs text-ink-soft">
            Профиль заполнен на {percent}%.{" "}
            {percent < 100
              ? "Заполни на 100% и получи «Досье готово»."
              : "Досье готово — отличная работа!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* прогресс */}
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-soft">
        <span>
          Шаг {step + 1} из {total} · {STEPS[step].title}
        </span>
        <span>{Math.round(((step + 1) / total) * 100)}%</span>
      </div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-blush">
        <div
          className="h-full rounded-full bg-petal-deep transition-all duration-300"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <ShunyaBubble
        message={STEPS[step].shunya}
        src={poses[step]}
        size={104}
        className="mb-8"
      />

      {/* ШАГ 0 — фото */}
      {step === 0 ? (
        <div className="flex flex-col items-center gap-4">
          {data.photo ? (
            <div className="relative aspect-square w-60 overflow-hidden rounded-3xl border-4 border-card shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photo}
                alt="Фото питомца"
                className="size-full object-cover"
              />
            </div>
          ) : (
            <label className="flex aspect-square w-60 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-blush bg-blush-soft/50 text-ink-soft transition-colors hover:border-petal hover:text-petal-deep">
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
          {data.photo ? (
            <label className="cursor-pointer text-sm font-semibold text-petal-deep hover:underline">
              Заменить фото
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhoto}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {/* ШАГ 1 — основная информация */}
      {step === 1 ? (
        <div className="space-y-4">
          <Field label="Кличка" required>
            <Input
              value={data.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Например, Шуня"
            />
          </Field>
          <Field label="Порода">
            <Select
              value={data.breed}
              onChange={(e) => set({ breed: e.target.value })}
            >
              <option value="">Выбери породу…</option>
              {breedOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Пол">
              <div className="flex gap-2">
                <TagToggle
                  active={data.sex === "male"}
                  onClick={() => set({ sex: "male" })}
                >
                  Мальчик
                </TagToggle>
                <TagToggle
                  active={data.sex === "female"}
                  onClick={() => set({ sex: "female" })}
                >
                  Девочка
                </TagToggle>
              </div>
            </Field>
            <Field label="Возраст">
              <Select
                value={data.age}
                onChange={(e) => set({ age: e.target.value })}
              >
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
            <Select
              value={data.size}
              onChange={(e) => set({ size: e.target.value })}
            >
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
              value={data.color}
              onChange={(e) => set({ color: e.target.value })}
              placeholder="Рыжий с белой грудкой"
            />
          </Field>
        </div>
      ) : null}

      {/* ШАГ 2 — приметы */}
      {step === 2 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {markTags.map((tag) => (
              <TagToggle
                key={tag}
                active={data.marks.includes(tag)}
                onClick={() => set({ marks: toggle(data.marks, tag) })}
              >
                {tag}
              </TagToggle>
            ))}
          </div>
          {data.marks.includes(MARK_CHIP) ? (
            <Field label="Номер чипа / клейма">
              <Input
                value={data.chip}
                onChange={(e) => set({ chip: e.target.value })}
                placeholder="643..."
              />
            </Field>
          ) : null}
          <Field label="Опиши своими словами">
            <Textarea
              value={data.marksText}
              onChange={(e) => set({ marksText: e.target.value })}
              placeholder="Любые приметы, по которым его узнают"
            />
          </Field>
        </div>
      ) : null}

      {/* ШАГ 3 — район и маршруты */}
      {step === 3 ? (
        <div className="space-y-4">
          <Field label="Район проживания" required>
            <Select
              value={data.district}
              onChange={(e) => set({ district: e.target.value })}
            >
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
          <Field label="Адрес" hint="Не публикуется — только для внутреннего поиска">
            <Input
              value={data.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Улица, дом"
            />
          </Field>
          <Field
            label="Места прогулок"
            hint={`До 5 точек · добавлено ${data.walkSpots.length}/5 · отметки на карте — скоро (Яндекс.Карты)`}
          >
            <div className="flex gap-2">
              <Input
                value={spotDraft}
                onChange={(e) => setSpotDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpot();
                  }
                }}
                placeholder="Парк Горького, площадка у дома…"
                disabled={data.walkSpots.length >= 5}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={addSpot}
                disabled={!spotDraft.trim() || data.walkSpots.length >= 5}
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </Field>
          {data.walkSpots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.walkSpots.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-sm text-ink"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        walkSpots: data.walkSpots.filter((_, j) => j !== i),
                      })
                    }
                    aria-label={`Убрать ${s}`}
                    className="text-ink-soft hover:text-status-lost"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ШАГ 4 — характер */}
      {step === 4 ? (
        <div className="flex flex-wrap gap-2">
          {temperamentTags.map((tag) => (
            <TagToggle
              key={tag}
              active={data.temperament.includes(tag)}
              onClick={() => set({ temperament: toggle(data.temperament, tag) })}
            >
              {tag}
            </TagToggle>
          ))}
        </div>
      ) : null}

      {/* ШАГ 5 — контакты */}
      {step === 5 ? (
        <div className="space-y-4">
          <Field label="Телефон хозяина" required>
            <Input
              type="tel"
              value={data.ownerPhone}
              onChange={(e) => set({ ownerPhone: e.target.value })}
              placeholder="+7 (___) ___-__-__"
            />
          </Field>
          <Field label="Дополнительный телефон" hint="Друг, родственник, выгульщик">
            <Input
              type="tel"
              value={data.extraPhone}
              onChange={(e) => set({ extraPhone: e.target.value })}
              placeholder="+7 (___) ___-__-__"
            />
          </Field>
          <Field label="Telegram">
            <Input
              value={data.telegram}
              onChange={(e) => set({ telegram: e.target.value })}
              placeholder="@username"
            />
          </Field>
          <Checkbox
            label="Разрешаю показывать мой телефон на публичной странице паспорта питомца"
            checked={data.showPhone}
            onChange={(e) => set({ showPhone: e.target.checked })}
          />
          <Checkbox
            label="Хочу получать push-уведомления о пропажах в моём районе"
            checked={data.wantPush}
            onChange={(e) => set({ wantPush: e.target.checked })}
          />
        </div>
      ) : null}

      {/* навигация */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={submitting}>
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col items-end gap-1">
          <Button size="lg" onClick={next} disabled={!proceedable || submitting}>
            {submitting
              ? "Сохраняю…"
              : step < total - 1
                ? "Далее"
                : "Готово! Добавить в стаю"}
            {!submitting ? (
              step < total - 1 ? (
                <ArrowRight className="size-5" aria-hidden />
              ) : (
                <PawPrint className="size-5" aria-hidden />
              )
            ) : null}
          </Button>
          {error ? (
            <span className="text-xs text-status-lost">{error}</span>
          ) : !proceedable ? (
            <span className="text-xs text-ink-soft">
              {step === 0
                ? "Добавь главное фото"
                : step === 1
                  ? "Укажи кличку"
                  : step === 3
                    ? "Выбери район"
                    : "Укажи телефон"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
