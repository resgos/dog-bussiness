import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ServicesList } from "@/components/services/ServicesList";
import type { Partner } from "@/components/services/PartnerCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Сервисы рядом" };

export default async function ServicesPage() {
  const partners = await db.partner.findMany({ orderBy: { name: "asc" } });

  const items: Partner[] = partners.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    district: p.district,
    address: p.address,
    phone: p.phone,
    url: p.url,
    description: p.description,
  }));

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <Badge tone="paw">🐾 Сервисы рядом</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Проверенные сервисы для хвостатых
        </h1>
        <p className="mt-2 text-ink-soft">
          Ветклиники, груминг, передержка и кинологи рядом с тобой — собрали
          надёжных партнёров по районам Москвы, чтобы заботиться о питомце было
          проще.
        </p>
      </div>

      <ServicesList items={items} />
    </Container>
  );
}
