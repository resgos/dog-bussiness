"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { postJson } from "@/lib/http";
import { districtsByOkrug } from "@/lib/districts";

// Типы сервисов — лейблы как в каталоге «Сервисы рядом» (PartnerCard.partnerTypes).
const typeOptions = [
  { value: "vet", label: "Ветклиника" },
  { value: "groomer", label: "Груминг" },
  { value: "hotel", label: "Передержка / гостиница" },
  { value: "trainer", label: "Кинолог" },
  { value: "shop", label: "Зоомагазин" },
] as const;

/** Клиентская форма B2B-заявки на размещение сервиса в каталоге. */
export function PartnerForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    setError(null);

    if (!name.trim()) {
      setError("Укажите название сервиса.");
      return;
    }
    if (!type) {
      setError("Выберите тип сервиса.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson<{ ok: boolean; id: string }>("/api/partners", {
        name: name.trim(),
        type,
        district: district || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        url: url.trim() || null,
        description: description.trim() || null,
        contactEmail: contactEmail.trim() || null,
      });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <SuccessNote variant="block">
          Заявка принята! После модерации сервис появится в каталоге.
        </SuccessNote>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Мы проверим данные и опубликуем карточку в разделе «Сервисы рядом».
          Если оставили e-mail — напишем о статусе и расскажем про промо-размещение
          в топе.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Название сервиса" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Ветклиника «Лапка»"
            maxLength={120}
          />
        </Field>

        <Field label="Тип сервиса" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Выберите тип…</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Район" hint="В каком районе Москвы находится сервис">
        <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">Выберите район…</option>
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

      <Field label="Адрес">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Улица, дом"
          maxLength={200}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Телефон">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            maxLength={40}
          />
        </Field>

        <Field label="Сайт">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            maxLength={200}
          />
        </Field>
      </div>

      <Field label="Описание" hint="Услуги, специализация, чем вы полезны собачникам">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Круглосуточная ветеринарная помощь, вакцинация, стационар…"
          maxLength={1000}
        />
      </Field>

      <Field
        label="Контактный e-mail"
        hint="Для связи по модерации и промо-размещению (не публикуется)"
      >
        <Input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="partner@example.ru"
          maxLength={120}
        />
      </Field>

      <ErrorBox message={error} />

      <Button size="lg" onClick={submit} disabled={submitting} className="w-full">
        {submitting ? "Отправляю…" : "Отправить заявку"}
        {!submitting ? <Send className="size-5" aria-hidden /> : null}
      </Button>
    </div>
  );
}
