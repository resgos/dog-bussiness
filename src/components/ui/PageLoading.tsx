import Image from "next/image";
import { Container } from "@/components/ui/Container";

/** Брендовый скелетон загрузки для тяжёлых страниц (Next loading.tsx). */
export function PageLoading({
  message = "Шуня бежит за данными…",
}: {
  message?: string;
}) {
  return (
    <Container className="py-16 sm:py-20">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative size-20 animate-bounce sm:size-24">
          <Image
            src="/shunya/sm/pose-happy.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain"
            priority
          />
        </div>
        <p className="text-sm font-semibold text-petal-deep">{message}</p>
        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl border border-blush bg-blush-soft/60"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
