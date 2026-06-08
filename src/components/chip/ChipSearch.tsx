"use client";

import { useState } from "react";
import { Search, ArrowRight, MapPin, Phone, Send } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ErrorBox } from "@/components/ui/ErrorBox";

type ChipResult = {
  found: boolean;
  pet?: {
    id: string;
    name: string;
    status: string;
    breed: string | null;
    district: string | null;
    photo: string | null;
  };
  contact?: { phone: string | null; telegram: string | null } | null;
};

type Status = "idle" | "loading" | "done";

export function ChipSearch() {
  const [chip, setChip] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ChipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (status === "loading") return;
    const digits = chip.replace(/\D/g, "");
    if (digits.length < 6) {
      setError("Введите номер чипа — обычно это 15 цифр.");
      return;
    }
    setError(null);
    setResult(null);
    setStatus("loading");
    try {
      const res = await fetch(`/api/chip?n=${encodeURIComponent(digits)}`);
      const j: ChipResult = await res.json();
      setResult(j);
    } catch {
      setError("Не удалось проверить чип. Проверьте связь и попробуйте ещё раз.");
    } finally {
      setStatus("done");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const pet = result?.pet;
  const contact = result?.contact;

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-blush bg-card p-6 shadow-card"
      >
        <Field
          label="Номер микрочипа"
          hint="Обычно 15 цифр — сканируется в любой ветклинике"
        >
          <Input
            inputMode="numeric"
            value={chip}
            onChange={(e) => setChip(e.target.value)}
            placeholder="643..."
          />
        </Field>

        <Button type="submit" size="lg" disabled={status === "loading"}>
          <Search className="size-5" aria-hidden />
          {status === "loading" ? "Проверяю…" : "Проверить"}
        </Button>

        {error ? <ErrorBox message={error} /> : null}
      </form>

      {/* Найдено — питомец есть в базе «Лапки» */}
      {result?.found && pet ? (
        <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
          <Badge tone="found">Нашёлся в базе „Лапки“</Badge>
          <h2 className="mt-3 text-2xl font-bold text-ink">{pet.name}</h2>
          {pet.breed ? <p className="mt-1 text-ink-soft">{pet.breed}</p> : null}
          {pet.district ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin className="size-4 text-petal" aria-hidden />
              Район: {pet.district}
            </p>
          ) : null}

          <div className="mt-5">
            <ButtonLink href={`/p/${pet.id}`} size="lg">
              Открыть паспорт
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>

          {contact && (contact.phone || contact.telegram) ? (
            <div className="mt-5 rounded-2xl bg-blush-soft p-4">
              <h3 className="text-sm font-bold text-ink">Свяжитесь с владельцем:</h3>
              <div className="mt-2 flex flex-col gap-2">
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                  >
                    <Phone className="size-4" aria-hidden />
                    {contact.phone}
                  </a>
                ) : null}
                {contact.telegram ? (
                  <a
                    href={`https://t.me/${contact.telegram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-petal-deep hover:underline"
                  >
                    <Send className="size-4" aria-hidden />
                    {contact.telegram}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-ink-soft">
            Мы сообщили владельцу, что чип проверили.
          </p>
        </div>
      ) : null}

      {/* Не найдено — даём следующие шаги и нацреестры */}
      {result && !result.found ? (
        <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
          <h2 className="text-xl font-bold text-ink">
            В базе „Лапки“ такой чип не найден
          </h2>
          <p className="mt-2 text-ink-soft">
            Это не страшно — собаку всё ещё можно вернуть домой. Вот что стоит
            сделать:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink">
            <li>
              Отсканируйте чип в ближайшей ветклинике — это бесплатно и занимает
              минуту.
            </li>
            <li>
              Проверьте номер в национальных реестрах:{" "}
              <a
                href="https://www.animal-id.ru/search/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-petal-deep hover:underline"
              >
                Animal-ID.RU
              </a>{" "}
              и{" "}
              <a
                href="https://animalface.ru/search/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-petal-deep hover:underline"
              >
                AnimalFace
              </a>
              .
            </li>
          </ul>

          <div className="mt-5">
            <ButtonLink href="/found/new" size="lg">
              Опубликовать находку
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
