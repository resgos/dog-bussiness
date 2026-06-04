import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const SIZES = ["small", "medium", "large"];

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const size = str(b.size);
  const user = await getCurrentUser().catch(() => null);

  const report = await db.foundReport.create({
    data: {
      userId: user?.id ?? null,
      finderName: str(b.finderName)?.slice(0, 80) ?? null,
      contactPhone: str(b.contactPhone)?.slice(0, 40) ?? null,
      contactTelegram: str(b.contactTelegram)?.slice(0, 80) ?? null,
      photo: str(b.photo),
      breed: str(b.breed)?.slice(0, 80) ?? null,
      color: str(b.color)?.slice(0, 80) ?? null,
      size: size && SIZES.includes(size) ? size : null,
      district: str(b.district),
      lat: num(b.lat),
      lng: num(b.lng),
      comment: str(b.comment)?.slice(0, 1000) ?? null,
      status: "open",
    },
  });

  // Обратный матчинг: оповещаем владельцев активных пропаж того же района.
  // Любой сбой здесь не должен мешать публикации находки — оборачиваем в try/catch.
  if (report.district) {
    try {
      const lost = await db.lostReport.findMany({
        where: { district: report.district, status: "active", userId: { not: null } },
        select: { userId: true },
        take: 200,
      });

      const ownerIds = Array.from(
        new Set(lost.map((l) => l.userId).filter((id): id is string => Boolean(id))),
      );

      if (ownerIds.length > 0) {
        const details =
          [report.color, report.breed].filter(Boolean).join(" ") || "собаку";
        await db.notification.createMany({
          data: ownerIds.map((userId) => ({
            userId,
            type: "found",
            title: "Возможно, нашли вашу собаку",
            body: `Рядом нашли: ${details} в районе`,
            link: "/found",
          })),
        });
      }
    } catch {
      /* рассылка не критична — игнорируем */
    }
  }

  return NextResponse.json({ id: report.id }, { status: 201 });
}
