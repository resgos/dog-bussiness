import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const petName = b && typeof b.petName === "string" ? b.petName.trim() : "";
  if (!petName) {
    return NextResponse.json({ error: "Выбери питомца" }, { status: 400 });
  }

  const radius = Number(b.radiusKm);
  const report = await db.lostReport.create({
    data: {
      petId: str(b.petId),
      petName: petName.slice(0, 80),
      breed: str(b.breed),
      photo: str(b.photo),
      district: str(b.district),
      lat: num(b.lat),
      lng: num(b.lng),
      lostAt: b.lostAt ? new Date(b.lostAt) : new Date(),
      comment: str(b.comment),
      radiusKm: [1, 3, 5, 10].includes(radius) ? radius : 3,
      status: "active",
    },
  });

  // Оповещаем соседей того же района о пропаже. Рассылка вынесена в try/catch:
  // любой сбой здесь не должен мешать созданию объявления.
  if (report.district) {
    try {
      const me = await getCurrentUser();
      const neighbours = await db.user.findMany({
        where: { district: report.district },
        select: { id: true },
        take: 200,
      });
      const recipients = neighbours.filter((u) => u.id !== me?.id);

      if (recipients.length > 0) {
        const details = [report.breed, report.district, report.comment]
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
          .join(" · ");

        await db.notification.createMany({
          data: recipients.map((u) => ({
            userId: u.id,
            type: "sos",
            title: `Рядом пропал ${report.petName}`,
            body: details || "Помогите найти — каждая минута на счету.",
            link: "/feed/lost",
          })),
        });
      }
    } catch {
      /* рассылка не критична — игнорируем */
    }
  }

  return NextResponse.json({ id: report.id }, { status: 201 });
}
