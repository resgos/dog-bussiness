import { MapPin, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pilotDistricts, districtsByOkrug } from "@/lib/districts";

export const metadata = { title: "Районные ленты" };

export default function DistrictsPage() {
  const byOkrug = districtsByOkrug();

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        align="left"
        eyebrow="📍 Районы"
        title="Районные ленты"
        subtitle="Лента привязывается к твоему району по геолокации или выбору. Сейчас в пилоте — несколько районов ЦАО, дальше масштабируемся на весь город."
      />

      {/* Пилотные районы */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {pilotDistricts.map((d) => (
          <Card key={d.id} interactive className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-paw/50 text-ink">
                <MapPin className="size-5" aria-hidden />
              </span>
              <Badge tone="paw">
                <Star className="size-3.5" aria-hidden />
                Пилот
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-bold">{d.name}</h3>
              <p className="text-sm text-ink-soft">{d.okrug} · лента открыта</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Полный список по округам */}
      <h2 className="mt-14 mb-5 text-xl font-bold">Все районы на подходе</h2>
      <div className="space-y-6">
        {Object.entries(byOkrug).map(([okrug, list]) => (
          <div key={okrug}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
              {okrug}
            </h3>
            <div className="flex flex-wrap gap-2">
              {list.map((d) => (
                <span
                  key={d.id}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm " +
                    (d.pilot
                      ? "border-petal bg-blush font-semibold text-petal-deep"
                      : "border-blush bg-card text-ink-soft")
                  }
                >
                  {d.pilot ? <Star className="size-3.5" aria-hidden /> : null}
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
