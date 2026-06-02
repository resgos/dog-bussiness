import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SosForm } from "@/components/sos/SosForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Сообщить о пропаже" };

export default async function SosPage() {
  const pets = await db.pet.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, breed: true, district: true },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto mb-8 max-w-xl">
        <Badge tone="lost">🚨 Режим SOS</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Сообщить о пропаже
        </h1>
        <p className="mt-2 text-ink-soft">
          Выбери питомца, отметь место и время, выбери радиус — соседи узнают за
          секунды.
        </p>
      </div>
      <SosForm pets={pets} />
    </Container>
  );
}
