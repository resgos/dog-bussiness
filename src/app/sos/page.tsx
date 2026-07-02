import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SosForm } from "@/components/sos/SosForm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Сообщить о пропаже" };

export default async function SosPage() {
  // В селекторе — только СВОИ питомцы: чужие тут не только бессмысленны
  // (SOS привяжется к заявителю), но и утечка чужих кличек/районов.
  // Гость и владелец без карточек получают быструю заявку свободным текстом.
  const user = await getCurrentUser().catch(() => null);
  const pets = user
    ? await db.pet.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, breed: true, district: true },
      })
    : [];

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto mb-8 max-w-xl">
        <Badge tone="lost">🚨 Режим SOS</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Сообщить о пропаже
        </h1>
        <p className="mt-2 text-ink-soft">
          Отметь место и время, выбери радиус — соседи узнают за секунды.
        </p>
      </div>
      <SosForm pets={pets} isAuthed={Boolean(user)} />
    </Container>
  );
}
