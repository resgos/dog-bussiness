"use client";

import { useState } from "react";
import { Mail, PawPrint } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { postJson } from "@/lib/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await postJson("/api/auth/forgot", { email: email.trim() });
      setDone(true);
    } catch {
      setError("Не получилось отправить письмо. Попробуй ещё раз чуть позже.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Забыли пароль?
          </h1>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Бывает! Укажи email, и я пришлю ссылку, чтобы задать новый пароль.
          </p>

          {done ? (
            <div className="mt-6 space-y-5">
              <SuccessNote variant="block">
                Письмо отправлено
              </SuccessNote>
              <p className="leading-relaxed text-ink-soft">
                Если такой аккаунт есть — мы отправили письмо со ссылкой для
                сброса. Загляни в почту (и в «Спам» на всякий случай) — ссылка
                действует 1 час.
              </p>
              <ButtonLink href="/auth" variant="secondary" size="lg" className="w-full">
                Вернуться ко входу
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
              <Field label="Email" required>
                <Input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <ErrorBox message={error} />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Отправляю…" : "Отправить ссылку"}
                {submitting ? null : <Mail className="size-5" aria-hidden />}
              </Button>

              <p className="text-center">
                <a
                  href="/auth"
                  className="text-sm font-semibold text-petal-deep hover:underline"
                >
                  Вспомнил(а) пароль? Войти
                </a>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-ink-soft">
          <PawPrint className="size-4 text-petal-deep" aria-hidden />
          Шуня поможет вернуться в стаю
        </p>
      </div>
    </Container>
  );
}
