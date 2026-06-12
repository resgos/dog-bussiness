"use client";

import { useEffect, useState } from "react";
import { Crosshair, Map, List, PawPrint } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { TagToggle } from "@/components/ui/TagToggle";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { LeafletMap } from "@/components/map/LeafletMap";
import { ShareButton } from "@/components/share/ShareButton";
import { postJson } from "@/lib/http";
import { dHash } from "@/lib/imghash";
import { districtsByOkrug } from "@/lib/districts";

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
  // Быстрая заявка (гость / без карточек питомца): кличка и приметы свободным
  // текстом — паникующий владелец не должен сперва проходить мастер питомца.
  const quick = pets.length === 0;
  const [qName, setQName] = useState("");
  const [qBreed, setQBreed] = useState("");
  const [qDistrict, setQDistrict] = useState("");
  const [qPhoto, setQPhoto] = useState<string | null>(null);
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

  // Фото с уменьшением (идиома FoundForm/PetWizard) — не храним мегабайты.
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
          setQPhoto(canvas.toDataURL("image/jpeg", 0.82));
        } else {
          setQPhoto(src);
        }
      };
      img.onerror = () => setQPhoto(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

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
    if (submitting) return;
    if (!quick && !pet) return;
    if (quick && !qName.trim()) {
      setError("Укажи кличку — по ней соседи узнают собаку.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const photoHash = quick && qPhoto ? await dHash(qPhoto) : null;
      const j = await postJson<{ id: string }>("/api/sos", {
        petId: quick ? null : pet!.id,
        petName: quick ? qName.trim() : pet!.name,
        breed: quick ? qBreed.trim() || null : pet!.breed,
        district: quick ? qDistrict || null : pet!.district,
        photo: quick ? qPhoto : null,
        photoHash,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        lostAt: lostAt || null,
        comment,
        radiusKm: radius,
        reward: reward ? Number(reward) : null,
      });
      setDoneId(j.id);
    } catch (e) {
      // Текст сервера (429 «Слишком часто», 400 «Некорректное фото») вместо
      // слепого «попробуй ещё раз» — иначе в SOS-флоу бесполезный ретрай.
      setError(
        e instanceof Error ? e.message : "Не удалось опубликовать. Попробуй ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          {/* Ссылка на само объявление — для гостя (userId=null) это единственный
              устойчивый ключ к нему: тут наблюдения, плакат и кнопка «Поделиться». */}
          <ButtonLink href={`/lost/${doneId}`} size="lg">
            <PawPrint className="size-5" aria-hidden />
            Открыть объявление
          </ButtonLink>
          {/* Репост — главный виральный канал: даём поделиться сразу, не уходя
              со страницы успеха (особенно важно гостю). */}
          <ShareButton
            path={`/lost/${doneId}`}
            title={`🆘 Разыскивается: ${(quick ? qName.trim() : pet?.name) || "собака"}`}
            text={`Помогите найти! Каждый репост приближает встречу. 🐾`}
          />
          <ButtonLink href="/map" variant="secondary" size="lg">
            <Map className="size-5" aria-hidden />
            На карту
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Сохрани ссылку на объявление — по ней вернёшься к поиску, добавишь
          приметы и распечатаешь плакат.
        </p>
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
        {quick ? (
          <>
            <Field
              label="Кто потерялся?"
              required
              hint="Без аккаунта тоже можно — кличка и район, остальное потом"
            >
              <Input
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                placeholder="Кличка, например Рекс"
                maxLength={80}
              />
            </Field>

            <Field label="Порода">
              <Input
                value={qBreed}
                onChange={(e) => setQBreed(e.target.value)}
                placeholder="Корги, метис, не знаю…"
                maxLength={80}
              />
            </Field>

            <Field label="Район">
              <Select
                value={qDistrict}
                onChange={(e) => setQDistrict(e.target.value)}
              >
                <option value="">Не выбран</option>
                {Object.entries(districtsByOkrug()).map(([okrug, list]) => (
                  <optgroup key={okrug} label={okrug}>
                    {list.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            {/* НЕ <Field>: тот оборачивает детей в <label>, и тап по превью или
                подписи форвардился бы на кнопку «Убрать фото» → молчаливое удаление. */}
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                Фото
              </span>
              {qPhoto ? (
                <div className="flex items-center gap-3">
                  <div className="relative size-20 overflow-hidden rounded-2xl border border-blush">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qPhoto}
                      alt="Фото потерявшейся собаки"
                      className="size-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setQPhoto(null)}
                  >
                    Убрать фото
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhoto}
                />
              )}
              <span className="mt-1 block text-xs text-ink-soft">
                По фото соседи узнают собаку быстрее всего
              </span>
            </div>
          </>
        ) : (
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
        )}

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
          <p className="mt-1.5 text-xs text-status-lost-ink">
            ⚠️ Не переводите предоплату за «возврат» — это частая схема
            мошенников. Награду отдавайте лично после встречи с собакой.
          </p>
        </Field>

        <div className="flex flex-col items-stretch gap-2">
          <Button variant="sos" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Поднимаю район…" : "🚨 Поднять район"}
          </Button>
          {error ? (
            <span className="text-center text-xs text-status-lost-ink">{error}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
