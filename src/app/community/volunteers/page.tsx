import Link from "next/link";
import { MapPin, Medal, PawPrint, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { plural } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { roleInfo } from "@/components/community/postMeta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Рейтинг волонтёров" };

// Медаль/цвет для первых трёх мест.
const podium = ["text-[#e0a106]", "text-[#9aa3ad]", "text-[#b8763b]"];

export default async function VolunteersPage() {
  const [topUsers, foundEvents] = await Promise.all([
    db.user.findMany({ orderBy: { helpedCount: "desc" }, take: 10 }),
    db.foundEvent.findMany({ select: { district: true } }),
  ]);

  // Агрегируем находки по районам (в JS — SQLite groupBy по nullable работает,
  // но так нагляднее и устойчивее).
  const counts = new Map<string, number>();
  for (const e of foundEvents) {
    if (!e.district) continue;
    counts.set(e.district, (counts.get(e.district) ?? 0) + 1);
  }
  const districtRanking = [...counts.entries()]
    .map(([id, count]) => ({ id, name: findDistrict(id)?.name ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <Container className="py-12 sm:py-16">
      {/* Hero с Шуней */}
      <div className="mb-10 rounded-3xl border border-blush bg-blush-soft p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <ShunyaBubble message="Спасибо каждому, кто помогает! Вот герои нашего района — благодаря им хвостики возвращаются домой. 🐾" />
          <ButtonLink href="/community" variant="secondary" className="shrink-0">
            ← В ленту района
          </ButtonLink>
        </div>
      </div>

      {/* Топ волонтёров */}
      <SectionHeading
        align="left"
        eyebrow="🏆 Рейтинг"
        title="Топ волонтёров"
        subtitle="Баллы начисляются за помощь: найденные питомцы, наблюдения, активность в районе."
      />

      {topUsers.length === 0 ? (
        <Card className="mt-8">
          <p className="text-ink-soft">
            Пока никто не набрал баллов. Помогите соседу — и окажетесь здесь первым!
          </p>
        </Card>
      ) : (
        <ol className="mt-8 space-y-3">
          {topUsers.map((u, i) => {
            const role = roleInfo(u.role);
            const district = u.district ? findDistrict(u.district)?.name : null;
            return (
              <li key={u.id}>
                <Card className="flex items-center gap-4 py-4">
                  <span
                    className={
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blush-soft text-lg font-bold " +
                      (podium[i] ?? "text-ink-soft")
                    }
                  >
                    {i < 3 ? <Medal className="size-6" aria-hidden /> : i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/community/volunteers/${u.id}`}
                        className="truncate font-bold text-ink hover:text-petal-deep hover:underline"
                      >
                        {u.name}
                      </Link>
                      <Badge tone={role.tone}>
                        <span aria-hidden>{role.emoji}</span>
                        {role.label}
                      </Badge>
                    </div>
                    {district ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-ink-soft">
                        <MapPin className="size-3.5 text-petal" aria-hidden />
                        {district}
                      </span>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xl font-bold text-petal-deep">{u.helpedCount}</div>
                    <div className="text-xs text-ink-soft">
                      {plural(u.helpedCount, "балл", "балла", "баллов")}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      {/* Рейтинг районов по находкам */}
      <div className="mt-14">
        <SectionHeading
          align="left"
          eyebrow="📍 Районы"
          title="Где находят чаще"
          subtitle="Сколько питомцев нашлось в каждом районе — по событиям «нашлась» из лент."
        />

        {districtRanking.length === 0 ? (
          <Card className="mt-8">
            <p className="text-ink-soft">
              Находок пока нет. Когда питомцы начнут возвращаться домой, районы появятся
              здесь.
            </p>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {districtRanking.map((d, i) => (
              <Card key={d.id} className="flex items-center gap-4 py-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-paw/40 text-ink">
                  {i === 0 ? (
                    <Trophy className="size-5 text-[#e0a106]" aria-hidden />
                  ) : (
                    <PawPrint className="size-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-ink">{d.name}</div>
                  <div className="text-sm text-ink-soft">
                    {d.count} {plural(d.count, "находка", "находки", "находок")}
                  </div>
                </div>
                <Badge tone="found">{d.count}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
