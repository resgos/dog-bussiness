"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, LogIn, MailWarning } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

type State = "loading" | "ok" | "error";

function VerifyState() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<State>(token ? "loading" : "error");

  useEffect(() => {
    // Токена нет — сразу ошибка, запрос не делаем.
    if (!token) return;
    let active = true;
    postJson("/api/auth/verify", { token })
      .then(() => {
        if (active) setState("ok");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 text-center shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Подтверждаем e-mail…
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Секундочку — проверяем твою ссылку. 🐾
        </p>
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="rounded-3xl border border-blush bg-card p-6 text-center shadow-card sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-status-found/15 text-status-found-ink">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          E-mail подтверждён ✓
        </h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Спасибо! Теперь ты точно не пропустишь оповещения о пропажах рядом.
        </p>
        <ButtonLink href="/profile" size="lg" className="mt-6 w-full">
          В личный кабинет
          <LogIn className="size-5" aria-hidden />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blush bg-card p-6 text-center shadow-card sm:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-status-lost/15 text-status-lost">
        <MailWarning className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
        Ссылка недействительна или истекла
      </h1>
      <p className="mt-2 leading-relaxed text-ink-soft">
        Возможно, ссылка устарела или уже была использована. Зайди в личный
        кабинет и отправь письмо ещё раз.
      </p>
      <ButtonLink href="/profile" size="lg" className="mt-6 w-full">
        В личный кабинет
        <LogIn className="size-5" aria-hidden />
      </ButtonLink>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        {/* useSearchParams требует Suspense-границу в App Router. */}
        <Suspense fallback={null}>
          <VerifyState />
        </Suspense>
      </div>
    </Container>
  );
}
