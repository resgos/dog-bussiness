import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ReportCard } from "@/components/feed/ReportCard";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";

export const dynamic = "force-dynamic";
export const metadata = { title: "Потерялись" };

export default async function FeedLostPage() {
  const reports = await db.lostReport.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    include: { sightings: true },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge tone="lost">🔴 Потерялись</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Активные поиски</h1>
          <p className="mt-1 text-ink-soft">Каждая минута на счету — помоги найти.</p>
        </div>
        <ButtonLink href="/sos" variant="sos" size="lg">
          Сообщить о пропаже
        </ButtonLink>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-8 shadow-card">
          <ShunyaBubble message="Сейчас в районе никто не потерялся — и это здорово! Гуляйте спокойно." />
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
