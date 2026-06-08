import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Pencil, Plus, QrCode, Stethoscope } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои питомцы" };

const statusTone: Record<string, "found" | "lost" | "neutral"> = {
  home: "neutral",
  lost: "lost",
  found: "found",
};
const statusLabel: Record<string, string> = {
  home: "Дома",
  lost: "Потерялась",
  found: "Найдена",
};

export default async function PetsPage() {
  const pets = await db.pet.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="petal">🐶 Мои питомцы</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Моя стая</h1>
        </div>
        <ButtonLink href="/profile/pets/add" size="lg">
          <Plus className="size-5" aria-hidden />
          Добавить питомца
        </ButtonLink>
      </div>

      {pets.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Покажи своих! Добавим первого красавчика — и я выдам ему паспорт с QR." />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-blush bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
            >
              {/* Клик по карточке ведёт на паспорт. Оверлей-ссылка, чтобы внутри
                  можно было держать отдельную ссылку «Изменить» без вложенных <a>. */}
              <Link
                href={`/p/${pet.id}`}
                aria-label={`Паспорт питомца ${pet.name}`}
                className="absolute inset-0 z-0 rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blush"
              />
              <div className="pointer-events-none relative aspect-[4/3] bg-blush-soft">
                {pet.photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pet.photo}
                    alt={`Фото питомца ${pet.name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="relative size-20">
                      <Image
                        src="/shunya/pose-surprised-cut.png"
                        alt="Шуня ждёт фото"
                        fill
                        sizes="80px"
                        className="object-contain"
                      />
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep">
                      <Camera className="size-4" aria-hidden />
                      Добавьте фото
                    </p>
                    <p className="text-xs leading-snug text-ink-soft">
                      Так собаку узнают быстрее
                    </p>
                  </div>
                )}
                <span className="absolute left-3 top-3">
                  <Badge tone={statusTone[pet.status] ?? "neutral"}>
                    {statusLabel[pet.status] ?? "Дома"}
                  </Badge>
                </span>
              </div>
              <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-1 p-5">
                <h2 className="text-lg font-bold">{pet.name}</h2>
                <p className="text-sm text-ink-soft">
                  {pet.breed || "Порода не указана"}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-petal-deep">
                    <QrCode className="size-4" aria-hidden />
                    Паспорт
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  {/* Отдельные ссылки над оверлеем — возвращаем им клики. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/pets/${pet.id}/health`}
                      className="pointer-events-auto relative z-10 inline-flex items-center gap-1.5 rounded-full border border-blush px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-petal hover:text-petal-deep"
                    >
                      <Stethoscope className="size-3.5" aria-hidden />
                      Здоровье
                    </Link>
                    <Link
                      href={`/profile/pets/${pet.id}/edit`}
                      className="pointer-events-auto relative z-10 inline-flex items-center gap-1.5 rounded-full border border-blush px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-petal hover:text-petal-deep"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Изменить
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
