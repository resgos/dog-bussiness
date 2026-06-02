import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ReportCard } from "@/components/feed/ReportCard";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";
export const metadata = { title: "Найдены" };

export default async function FeedFoundPage() {
  const reports = await db.lostReport.findMany({
    where: { status: "found" },
    orderBy: { createdAt: "desc" },
    include: { sightings: true },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <Badge tone="found">🟢 Найдены</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Счастливые финалы</h1>
        <p className="mt-1 text-ink-soft">Собаки, которых нашли всей стаёй.</p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble
            src="/shunya/pose-happy.png"
            message="Скоро здесь будут счастливые встречи. Помогай искать — и их станет больше!"
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </Container>
  );
}
