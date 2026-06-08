import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SearchMap } from "@/components/map/SearchMap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта поиска" };

export default async function MapPage() {
  const me = await getCurrentUser();

  const [reports, walkers] = await Promise.all([
    db.lostReport.findMany({
      orderBy: { createdAt: "desc" },
      include: { sightings: true },
    }),
    // «Гуляю сейчас» — живые соседи за последние 2 часа.
    db.walkCheckin.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 2 * 3600 * 1000) } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Гуляет ли сам пользователь — чтобы кнопка стартовала в нужном состоянии.
  const walking = me ? walkers.some((w) => w.userId === me.id) : false;

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
      <SearchMap reports={reports} walkers={walkers} walking={walking} />
    </Container>
  );
}
