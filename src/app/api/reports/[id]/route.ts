import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Сменить статус объявления. При переходе в "found" создаём событие
// для живого счётчика «собак найдено сегодня».
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const next = body?.status === "home" ? "home" : "found";

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const updated = await db.lostReport.update({
    where: { id },
    data: { status: next },
  });

  if (next === "found" && report.status !== "found") {
    await db.foundEvent.create({
      data: { petName: report.petName, district: report.district },
    });
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
