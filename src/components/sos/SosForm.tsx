"use client";

import { useEffect, useState } from "react";
import { Crosshair, ArrowRight, Map, List, BookOpen } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { LeafletMap } from "@/components/map/LeafletMap";
import { postJson } from "@/lib/http";

type PetLite = {
  id: string;
  name: string;
  breed: string | null;
  district: string | null;
};

const radii = [1, 3, 5, 10];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SosForm({ pets }: { pets: PetLite[] }) {
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [comment, setComment] = useState("");
  const [radius, setRadius] = useState(3);
  const [reward, setReward] = useState("");
  const [lostAt, setLostAt] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLostAt(toLocalInput(new Date()));
  }, []);

  const pet = pets.find((p) => p.id === petId);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("err");
      return;
    }
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("ok");
      },
      () => setGeo("err"),
      { timeout: 8000 },
    );
  };

  const submit = async () => {
    if (!pet || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const j = await postJson<{ id: string }>("/api/sos", {
        petId: pet.id,
        petName: pet.name,
        breed: pet.breed,
        district: pet.district,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        lostAt: lostAt || null,
        comment,
        radiusKm: radius,
        reward: reward ? Number(reward) : null,
      });
      setDoneId(j.id);
    } catch {
      setError("Не удалось опубликовать. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pets.length === 0) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
        <ShunyaBubble message="Сначала добавь питомца — тогда я смогу мгновенно поднять район, если он потеряется." />
        <div className="mt-6">
          <ButtonLink href="/profile/pets/add" size="lg">
            Добавить питомца
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (doneId) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <SuccessNote className="mb-3">Объявление опубликовано</SuccessNote>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Подняли район за 60 секунд! 🐾
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Соседи в радиусе {radius} км получат уведомление, объявление попало в
          районную ленту и Telegram-чаты. Держись — стая уже ищет!
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/map" size="lg">
            <Map className="size-5" aria-hidden />
            На карту поиска
          </ButtonLink>
          <ButtonLink href="/feed/lost" variant="secondary" size="lg">
            <List className="size-5" aria-hidden />
            В ленту «Потерялись»
          </ButtonLink>
          <ButtonLink href="/guide/lost" variant="secondary" size="lg">
            <BookOpen className="size-5" aria-hidden />
            Что делать дальше
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <ShunyaBubble
        src="/shunya/pose-surprised.png"
        message="Не паникуй — я рядом. Заполни по-быстрому, и я подниму весь район."
        className="mb-8"
      />

      <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <Field label="Кто потерялся?" required>
          <Select value={petId} onChange={(e) => setPetId(e.target.value)}>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.breed ? ` · ${p.breed}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Где пропал?"
          hint={
            coords
              ? "📍 Точка отмечена — можно поправить кликом по карте"
              : geo === "err"
                ? "Не удалось определить — ткни точку на карте или поиск пойдёт по району питомца"
                : "Ткни точку пропажи на карте или определи по геолокации"
          }
        >
          <div className="space-y-3">
            <LeafletMap
              picker
              picked={coords}
              pickedRadiusKm={radius}
              onPick={(lat, lng) => {
                setCoords({ lat, lng });
                setGeo("ok");
              }}
              center={coords ? [coords.lat, coords.lng] : undefined}
              height={300}
            />
            <Button
              type="button"
              variant={coords ? "secondary" : "primary"}
              onClick={locate}
              disabled={geo === "loading"}
            >
              <Crosshair className="size-4" aria-hidden />
              {geo === "loading"
                ? "Определяю…"
                : coords
                  ? "Геолокация получена"
                  : "Определить геолокацию"}
            </Button>
          </div>
        </Field>

        <Field label="Когда пропал?">
          <Input
            type="datetime-local"
            value={lostAt}
            onChange={(e) => setLostAt(e.target.value)}
          />
        </Field>

        <Field label="Радиус оповещения" required>
          <div className="flex flex-wrap gap-2">
            {radii.map((r) => (
              <TagToggle
                key={r}
                active={radius === r}
                onClick={() => setRadius(r)}
              >
                {r} км
              </TagToggle>
            ))}
          </div>
        </Field>

        <Field label="Комментарий" hint="Была ли на поводке, в какую сторону побежала">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Сорвалась с поводка у парка, испугалась салюта…"
          />
        </Field>

        <Field
          label="Награда нашедшему, ₽"
          hint="Необязательно — но мотивирует соседей искать активнее"
        >
          <Input
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Например, 5000"
          />
          <p className="mt-1.5 text-xs text-status-lost">
            ⚠️ Не переводите предоплату за «возврат» — это частая схема
            мошенников. Награду отдавайте лично после встречи с собакой.
          </p>
        </Field>

        <div className="flex flex-col items-stretch gap-2">
          <Button variant="sos" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Поднимаю район…" : "🚨 Поднять район"}
          </Button>
          {error ? (
            <span className="text-center text-xs text-status-lost">{error}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
