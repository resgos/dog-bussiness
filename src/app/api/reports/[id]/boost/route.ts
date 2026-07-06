import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Boost — платное продвижение объявления о пропаже (модель PawBoost).
// Владелец «поднимает» свой розыск в топ ленты на 7 дней; объявление
// подсвечивается бейджем. ВАЖНО: реального платёжного шлюза нет — это
// MVP-заглушка: активируем продвижение и пишем запись в Purchase (реестр
// выручки), без фактического списания денег.
const BOOST_PRICE_RUB = 299;
const BOOST_DURATION_MS = 7 * 24 * 3600 * 1000;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await rateLimit(ipKey(req, "boost"), 10, 60_000))) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report || report.userId !== user.id) {
    return NextResponse.json(
      { error: "Поднять можно только своё объявление" },
      { status: 403 },
    );
  }

  const now = new Date();
  const boostedUntil = new Date(now.getTime() + BOOST_DURATION_MS);

  // Атомарный CAS вместо check-then-act: активируем буст только если он ещё не
  // активен (boostedUntil пуст или в прошлом). При гонке двух запросов ровно
  // ОДИН получит count===1 → ровно одна запись в Purchase. Раньше двойной клик
  // проходил обе проверки и списывал 598 ₽ вместо 299 (критично для шлюза).
  const claimed = await db.lostReport.updateMany({
    where: {
      id,
      OR: [{ boostedUntil: null }, { boostedUntil: { lt: now } }],
    },
    data: { boostedUntil },
  });
  if (claimed.count === 0) {
    // Буст уже активен (или гонка проиграна) — повторно не списываем.
    const fresh = await db.lostReport.findUnique({
      where: { id },
      select: { boostedUntil: true },
    });
    return NextResponse.json({
      ok: true,
      boostedUntil: fresh?.boostedUntil,
      already: true,
    });
  }

  // Реестр выручки: фиксируем «покупку» продвижения (демо-оплата).
  await db.purchase.create({
    data: { userId: user.id, kind: "boost", refId: id, amountRub: BOOST_PRICE_RUB },
  });

  return NextResponse.json({ ok: true, boostedUntil });
}
