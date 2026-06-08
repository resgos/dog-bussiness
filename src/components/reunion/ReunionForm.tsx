"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { districtsByOkrug } from "@/lib/districts";

/**
 * Сжимает выбранное фото через canvas (макс. сторона ~1000px, JPEG 0.8) →
 * data URL, чтобы не отправлять мегабайты (как в PhotoManager/FoundForm).
 */
function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function ReunionForm() {
  const router = useRouter();

  const [petName, setPetName] = useState("");
  const [story, setStory] = useState("");
  const [district, setDistrict] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Сбрасываем input, чтобы можно было выбрать тот же файл повторно.
    e.target.value = "";
    if (!file) return;
    try {
      setPhoto(await compressToDataUrl(file));
    } catch {
      setError("Не удалось загрузить фото. Попробуй другое.");
    }
  };

  const submit = async () => {
    if (submitting) return;
    if (!petName.trim() || !story.trim()) {
      setError("Заполни кличку и историю.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reunions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petName: petName.trim(),
          story: story.trim(),
          district: district || null,
          photo,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Не удалось опубликовать историю.");
      }
      setDone(true);
      router.push("/reunited");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось опубликовать историю.",
      );
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 text-center shadow-card sm:p-8">
        <SuccessNote className="mb-3">История опубликована</SuccessNote>
        <h2 className="text-2xl font-bold">Спасибо, что поделился! 💞</h2>
        <p className="mt-2 text-ink-soft">
          Открываем ленту историй — твоя уже там.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      <Field label="Кличка собаки" required>
        <Input
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Например, Шуня"
          maxLength={80}
        />
      </Field>

      <Field label="История возвращения" required>
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Как нашлась? Кто помог? Что почувствовали?"
          maxLength={2000}
          className="min-h-40"
        />
      </Field>

      <Field label="Район" hint="Где всё случилось — по желанию">
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

      <Field label="Фото счастливой встречи" hint="По желанию — оно украсит историю">
        {photo ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-3xl border-4 border-card shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Счастливая встреча"
                className="size-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-status-lost hover:underline"
            >
              <Trash2 className="size-4" aria-hidden />
              Удалить фото
            </button>
          </div>
        ) : (
          <label className="flex aspect-[4/3] w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-blush bg-blush-soft/50 text-ink-soft transition-colors hover:border-petal hover:text-petal-deep">
            <Camera className="size-9" aria-hidden />
            <span className="text-sm font-semibold">Загрузить фото</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhoto}
            />
          </label>
        )}
      </Field>

      <ErrorBox message={error} />

      <Button
        size="lg"
        onClick={submit}
        disabled={submitting}
        className="w-full"
      >
        <Heart className="size-5" aria-hidden />
        {submitting ? "Публикую…" : "Опубликовать историю"}
      </Button>
    </div>
  );
}
