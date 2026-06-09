"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // В проде здесь — отправка в систему мониторинга.
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="relative mx-auto size-40 sm:size-48">
          <Image
            src="/shunya/pose-grumpy-cut.png"
            alt="Шуня огорчена"
            fill
            sizes="192px"
            className="object-contain"
            priority
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          Ой, что-то пошло не так
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Шуня уже разбирается. Чаще всего помогает обновить страницу — попробуй
          ещё раз.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Попробовать снова
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            На главную
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
