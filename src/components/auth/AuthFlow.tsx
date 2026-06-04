"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ArrowRight, LogIn, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { districtsByOkrug } from "@/lib/districts";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/components/auth/actions";

type Mode = "phone" | "email";
type Tab = "register" | "login";

const initial: AuthState = {};

/** Кнопка отправки формы: сама уходит в «загрузку», пока крутится Server Action. */
function SubmitButton({
  children,
  pending: pendingText,
}: {
  children: React.ReactNode;
  pending: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** Переключатель «телефон / email» — общий для входа и регистрации. */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(mode === "phone" ? "email" : "phone")}
      className="text-sm font-semibold text-petal-deep hover:underline"
    >
      {mode === "phone" ? "Использовать email и пароль" : "Использовать телефон"}
    </button>
  );
}

function DistrictSelect() {
  return (
    <Field label="Район проживания" required>
      <Select name="district" defaultValue="" required>
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
  );
}

function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);
  const [mode, setMode] = useState<Mode>("phone");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      <Field label="Как тебя зовут?" required>
        <Input name="name" placeholder="Например, Аня" autoComplete="name" required />
      </Field>

      {mode === "phone" ? (
        <Field label="Телефон" required>
          <Input
            name="phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            required
          />
        </Field>
      ) : (
        <Field label="Email" required>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
      )}

      <Field label="Пароль" required hint="Минимум 6 символов">
        <Input
          name="password"
          type="password"
          placeholder="Придумай пароль"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </Field>

      <DistrictSelect />

      <Field label="Telegram (необязательно)" hint="Чтобы я мог писать о пропажах рядом">
        <Input name="telegram" placeholder="@username" />
      </Field>

      <ModeToggle mode={mode} onChange={setMode} />

      <ErrorBox message={state.error} />

      <SubmitButton pending="Заводим карточку…">
        В стаю
        <PawPrint className="size-5" aria-hidden />
      </SubmitButton>
    </form>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  const [mode, setMode] = useState<Mode>("phone");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      {mode === "phone" ? (
        <Field label="Телефон" required>
          <Input
            name="phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            required
          />
        </Field>
      ) : (
        <Field label="Email" required>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
      )}

      <Field label="Пароль" required>
        <Input
          name="password"
          type="password"
          placeholder="Твой пароль"
          autoComplete="current-password"
          required
        />
      </Field>

      <ModeToggle mode={mode} onChange={setMode} />

      <ErrorBox message={state.error} />

      <SubmitButton pending="Нюхаю входящих…">
        Войти
        <LogIn className="size-5" aria-hidden />
      </SubmitButton>
    </form>
  );
}

export function AuthFlow() {
  // 0 — приветствие Шуни, затем форма с табами.
  const [greeted, setGreeted] = useState(false);
  const [tab, setTab] = useState<Tab>("register");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      <div className="relative size-36 overflow-hidden rounded-[2rem] border-4 border-card bg-card shadow-soft ring-1 ring-blush">
        <Image
          src={greeted ? "/shunya/pose-happy.png" : "/shunya/pose-wave.png"}
          alt="Шуня"
          fill
          priority
          sizes="144px"
          className="object-contain p-3"
        />
      </div>

      {!greeted ? (
        <>
          <p className="mt-5 max-w-md text-center text-lg leading-relaxed text-ink">
            Привет! Я Шуня. Ушастая, быстрая и всегда на связи. Мой район — твой
            район, а мои друзья — все местные собаки и их хозяева!
          </p>
          <p className="mt-2 max-w-md text-center text-ink-soft">
            Подпишу тебя на район — если рядом потеряется собака, ты узнаешь
            первым.
          </p>
          <Button size="lg" className="mt-8" onClick={() => setGreeted(true)}>
            Поехали
            <ArrowRight className="size-5" aria-hidden />
          </Button>
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setGreeted(true);
            }}
            className="mt-4 text-sm font-semibold text-petal-deep hover:underline"
          >
            Уже в стае? Войти
          </button>
        </>
      ) : (
        <div className="mt-6 w-full">
          {/* Табы Вход / Регистрация */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-blush bg-card p-1">
            <button
              type="button"
              onClick={() => setTab("register")}
              aria-pressed={tab === "register"}
              className={
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors " +
                (tab === "register"
                  ? "bg-paw text-ink shadow-soft"
                  : "text-ink-soft hover:text-ink")
              }
            >
              Регистрация
            </button>
            <button
              type="button"
              onClick={() => setTab("login")}
              aria-pressed={tab === "login"}
              className={
                "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors " +
                (tab === "login"
                  ? "bg-paw text-ink shadow-soft"
                  : "text-ink-soft hover:text-ink")
              }
            >
              Вход
            </button>
          </div>

          <p className="mb-5 text-center text-ink-soft">
            {tab === "register"
              ? "Давай познакомимся — и я подниму весь район за 60 секунд, если что."
              : "С возвращением! Стая скучала 🐾"}
          </p>

          <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-7">
            {tab === "register" ? <RegisterForm /> : <LoginForm />}
          </div>
        </div>
      )}
    </div>
  );
}
