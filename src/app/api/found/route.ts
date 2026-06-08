import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto } from "@/lib/storage";
import { notifyMany } from "@/lib/notify";
import { rankLostForFound } from "@/lib/match";
import { rateLimit, ipKey } from "@/lib/ratelimit";

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
  if (!rateLimit(ipKey(req, "found"), 5, 60_000)) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const size = str(b.size);
  const user = await getCurrentUser().catch(() => null);

  const report = await db.foundReport.create({
    data: {
      userId: user?.id ?? null,
      finderName: str(b.finderName)?.slice(0, 80) ?? null,
      contactPhone: str(b.contactPhone)?.slice(0, 40) ?? null,
      contactTelegram: str(b.contactTelegram)?.slice(0, 80) ?? null,
      photo: await savePhoto(str(b.photo)),
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

  const found = report;

  // Умный алерт: новая находка может совпасть с активными пропажами — оповестим владельцев.
  try {
    const losts = await db.lostReport.findMany({ where: { status: "active" } });
    const matches = rankLostForFound(found, losts, 40); // только сильные совпадения
    const ownerIds = [...new Set(
      matches.map((m) => m.item.userId).filter((uid): uid is string => Boolean(uid) && uid !== found.userId),
    )];
    if (ownerIds.length) {
      await notifyMany(ownerIds, {
        type: "found",
        title: "Возможно, нашлась твоя собака! 🔎",
        body: `Рядом опубликовали находку, похожую по приметам. Загляни в ленту находок.`,
        link: "/feed/found",
      });
    }
  } catch { /* алерт некритичен */ }

  return NextResponse.json({ id: report.id }, { status: 201 });
}
