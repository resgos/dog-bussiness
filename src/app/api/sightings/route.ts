import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser, notifyMany } from "@/lib/notify";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export async function POST(req: Request) {
  if (!rateLimit(ipKey(req, "sighting"), 10, 60_000)) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }
  const user = await getCurrentUser();
  const b = await req.json().catch(() => null);
  const sighting = await db.sighting.create({
    data: {
      reportId: str(b?.reportId),
      lat: num(b?.lat),
      lng: num(b?.lng),
      comment: str(b?.comment)?.slice(0, 500) ?? null,
      photo: str(b?.photo),
      userId: user?.id ?? null,
    },
  });

  // «Петля владельца»: если наблюдение привязано к чьему-то поиску —
  // уведомляем владельца, что его собаку видели. Некритично → try/catch.
  if (sighting.reportId) {
    try {
      const report = await db.lostReport.findUnique({
        where: { id: sighting.reportId },
      });
      if (report?.userId) {
        await notifyUser(report.userId, {
          type: "found",
          title: `Вашу собаку видели: ${report.petName}`,
          body: sighting.comment || "Кто-то отметил наблюдение на карте поиска",
          link: "/profile/my-searches",
        });
      }

      // Уведомляем подписчиков розыска о новом наблюдении (владельца не дублируем).
      if (report) {
        const subs = await db.reportSubscription.findMany({
          where: { reportId: sighting.reportId },
          select: { userId: true },
        });
        await notifyMany(
          subs.map((s) => s.userId).filter((uid) => uid !== report.userId),
          {
            type: "info",
            title: "Новое наблюдение 🔎",
            body: `Кто-то видел собаку из розыска «${report.petName}»`,
            link: "/map",
          },
        );
      }
    } catch {
      /* уведомления некритичны — игнорируем */
    }
  }

  return NextResponse.json({ id: sighting.id }, { status: 201 });
}
