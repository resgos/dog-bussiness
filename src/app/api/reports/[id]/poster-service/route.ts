import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// «Расклеить за вас» (P1 #7 бизнес-беклога): заказ печати и расклейки
// розыскного плаката по району силами партнёра-курьера. Как буст и донат —
// MVP-заглушка без платёжного шлюза: пишем Purchase (kind="poster-service").
// Идемпотентность: одна активная заявка на розыск — повторный клик не
// списывает деньги ещё раз (критично при подключении реального шлюза).
const POSTER_SERVICE_PRICE_RUB = 990;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await rateLimit(ipKey(req, "poster-service"), 10, 60_000))) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Розыск не найден" }, { status: 404 });
  }
  if (report.status !== "active") {
    return NextResponse.json({ error: "Розыск уже закрыт" }, { status: 400 });
  }

  const existing = await db.purchase.findFirst({
    where: { kind: "poster-service", refId: id },
  });
  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  await db.purchase.create({
    data: {
      userId: user.id,
      kind: "poster-service",
      refId: id,
      amountRub: POSTER_SERVICE_PRICE_RUB,
    },
  });

  return NextResponse.json({ ok: true });
}
