"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { postJson } from "@/lib/http";

const MIN_PASSWORD = 6;

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Токена нет — ссылка битая, форму не показываем.
  if (!token) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Ссылка недействительна
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Похоже, ссылка для сброса пароля неполная или устарела. Запроси сброс
          ещё раз — пришлём новое письмо.
        </p>
        <ButtonLink
          href="/auth/forgot"
          size="lg"
          className="mt-6 w-full"
        >
          Запросить сброс заново
        </ButtonLink>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`Пароль коротковат — нужно минимум ${MIN_PASSWORD} символов.`);
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают — проверь оба поля.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson("/api/auth/reset", { token, password });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось сменить пароль. Попробуй ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
        <SuccessNote variant="block" className="mb-3">
          Пароль обновлён
        </SuccessNote>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Готово! 🐾
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Новый пароль сохранён. Теперь можно войти в стаю с ним.
        </p>
        <ButtonLink href="/auth" size="lg" className="mt-6 w-full">
          Войти
          <LogIn className="size-5" aria-hidden />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Новый пароль</h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        Придумай новый пароль для входа — и снова в стаю.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Новый пароль" required hint="Минимум 6 символов">
          <Input
            name="password"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="Придумай новый пароль"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
          />
        </Field>

        <Field label="Повтори пароль" required>
          <Input
            name="confirm"
            type="password"
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            placeholder="Ещё раз, чтобы не ошибиться"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
          />
        </Field>

        <ErrorBox message={error} />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Сохраняю…" : "Сохранить пароль"}
          {submitting ? null : <KeyRound className="size-5" aria-hidden />}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        {/* useSearchParams требует Suspense-границу в App Router. */}
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </Container>
  );
}
