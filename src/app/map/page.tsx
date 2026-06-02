import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SearchMap } from "@/components/map/SearchMap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта поиска" };

export default async function MapPage() {
  const reports = await db.lostReport.findMany({
    orderBy: { createdAt: "desc" },
    include: { sightings: true },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <Badge tone="petal">🗺️ Карта</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Карта поиска</h1>
        <p className="mt-1 text-ink-soft">
          Активные поиски, найденные собаки и места наблюдений. Видел похожую —
          поставь метку!
        </p>
      </div>
      <SearchMap reports={reports} />
    </Container>
  );
}
