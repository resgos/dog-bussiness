"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, PawPrint, Send } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { districtsByOkrug } from "@/lib/districts";
import {
  emptyReg,
  isPhoneValid,
  validateRegistration,
  type RegData,
  type RegErrors,
} from "@/lib/onboarding";

const poses = ["/shunya/pose-wave.png", "/shunya/pose-happy.png", "/shunya/pose-surprised.png"];

const lines = [
  "Привет! Я Шуня. Ушастая, быстрая и всегда на связи. Мой район — твой район, а мои друзья — все местные собаки и их хозяева!",
  "Давай познакомимся! Подпишу тебя на район — если рядом потеряется собака, ты узнаешь первым.",
  "Готово! Теперь мы — стая. Если что-то случится, я подниму весь район за 60 секунд. А пока — гуляй спокойно!",
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RegData>(emptyReg);
  const [errors, setErrors] = useState<RegErrors>({});
  const [smsSent, setSmsSent] = useState(false);

  const set = (patch: Partial<RegData>) => setData((d) => ({ ...d, ...patch }));

  const submitReg = () => {
    const e = validateRegistration(data);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      {/* индикатор шагов */}
      <div className="mb-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={
              "h-2 rounded-full transition-all " +
              (i === step
                ? "w-8 bg-petal-deep"
                : i < step
                  ? "w-2 bg-petal"
                  : "w-2 bg-blush")
            }
          />
        ))}
      </div>

      <div className="relative size-40 overflow-hidden rounded-[2rem] border-4 border-card bg-card shadow-soft ring-1 ring-blush">
        <Image
          src={poses[step]}
          alt="Шуня"
          fill
          priority
          sizes="160px"
          className="object-contain p-3"
        />
      </div>

      <p className="mt-5 max-w-md text-center text-lg leading-relaxed text-ink">
        {lines[step]}
      </p>

      {/* Шаг 0 — приветствие */}
      {step === 0 ? (
        <Button size="lg" className="mt-8" onClick={() => setStep(1)}>
          Поехали
          <ArrowRight className="size-5" aria-hidden />
        </Button>
      ) : null}

      {/* Шаг 1 — регистрация (ТЗ 4.1) */}
      {step === 1 ? (
        <div className="mt-8 w-full space-y-4">
          <Field label="Как тебя зовут?" required hint={errors.name}>
            <Input
              value={data.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Например, Аня"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          {data.mode === "phone" ? (
            <Field label="Телефон" required hint={errors.phone}>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                  aria-invalid={Boolean(errors.phone)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={!isPhoneValid(data.phone)}
                  onClick={() => setSmsSent(true)}
                >
                  Код в SMS
                </Button>
              </div>
            </Field>
          ) : (
            <>
              <Field label="Email" required hint={errors.email}>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
              <Field label="Пароль" required hint={errors.password}>
                <Input
                  type="password"
                  value={data.password}
                  onChange={(e) => set({ password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  aria-invalid={Boolean(errors.password)}
                />
              </Field>
            </>
          )}

          {smsSent && data.mode === "phone" ? (
            <Field label="Код из SMS" hint="Демо: введи любые 4 цифры">
              <Input
                inputMode="numeric"
                value={data.smsCode}
                onChange={(e) => set({ smsCode: e.target.value })}
                placeholder="• • • •"
                maxLength={4}
              />
            </Field>
          ) : null}

          <Field label="Район проживания" required hint={errors.district}>
            <Select
              value={data.district}
              onChange={(e) => set({ district: e.target.value })}
              aria-invalid={Boolean(errors.district)}
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

          <Field label="Telegram (необязательно)">
            <Input
              value={data.telegram}
              onChange={(e) => set({ telegram: e.target.value })}
              placeholder="@username"
            />
          </Field>

          <button
            type="button"
            onClick={() =>
              set({ mode: data.mode === "phone" ? "email" : "phone" })
            }
            className="text-sm font-semibold text-petal-deep hover:underline"
          >
            {data.mode === "phone"
              ? "Войти по email и паролю"
              : "Войти по номеру телефона"}
          </button>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4" aria-hidden />
              Назад
            </Button>
            <Button size="lg" onClick={submitReg}>
              В стаю
              <PawPrint className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Шаг 2 — готово */}
      {step === 2 ? (
        <div className="mt-8 flex w-full flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-status-found/15 px-4 py-2 text-sm font-bold text-[#4f9e63]">
            <Check className="size-4" aria-hidden />
            Достижение «Сосед» на подходе
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/profile/pets/add" size="lg">
              Добавить питомца
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/profile" variant="secondary" size="lg">
              В личный кабинет
            </ButtonLink>
          </div>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-petal-deep hover:underline"
          >
            <Send className="size-4" aria-hidden />
            Подключить Telegram-уведомления
          </a>
        </div>
      ) : null}
    </div>
  );
}
