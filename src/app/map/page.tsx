import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SearchMap } from "@/components/map/SearchMap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Карта поиска" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; see?: string }>;
}) {
  const { report, see } = await searchParams;
  const me = await getCurrentUser();

  const [reports, walkers, founds] = await Promise.all([
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
    // Открытые находки с координатами — зелёные метки «найдена собака» на карте.
    db.foundReport.findMany({
      where: { status: "open", lat: { not: null }, lng: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        lat: true,
        lng: true,
        breed: true,
        color: true,
        district: true,
        photo: true,
        createdAt: true,
      },
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
      <SearchMap
        reports={reports}
        walkers={walkers}
        founds={founds}
        walking={walking}
        initialReportId={report ?? null}
        openSightingForReport={see === "1"}
      />
    </Container>
  );
}
