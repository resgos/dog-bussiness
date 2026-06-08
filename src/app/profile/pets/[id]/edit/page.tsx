import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { EditPetForm } from "@/components/pets/EditPetForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Изменить питомца" };

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  // Гость — мягко зовём войти, без жёсткого редиректа.
  if (!user) {
    return (
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
            <ShunyaBubble message="Чтобы менять карточку питомца, сначала войди — так я узнаю, что это твой красавчик." />
            <div className="mt-6">
              <ButtonLink href="/auth" size="lg">
                Войти
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const pet = await db.pet.findUnique({ where: { id } });
  // Нет питомца или это не его — 404, чтобы не раскрывать чужие карточки.
  if (!pet || pet.userId !== user.id) {
    notFound();
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Badge tone="petal">✏️ Редактирование</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Изменить питомца
        </h1>
        <p className="mt-2 text-ink-soft">
          Поправь данные — обновится и публичный паспорт с QR.
        </p>
      </div>

      <div className="mt-8">
        <EditPetForm
          pet={{
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            sex: pet.sex,
            age: pet.age,
            size: pet.size,
            color: pet.color,
            district: pet.district,
            ownerPhone: pet.ownerPhone,
            telegram: pet.telegram,
            showPhone: pet.showPhone,
            marksText: pet.marksText,
            chip: pet.chip,
            status: pet.status,
          }}
        />
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <ButtonLink href="/profile/pets" variant="ghost">
          <ArrowLeft className="size-4" aria-hidden />
          К моим питомцам
        </ButtonLink>
      </div>
    </Container>
  );
}
