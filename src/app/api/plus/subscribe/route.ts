import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Срок подписки «Лапка+» — 30 дней с момента оформления.
const PLAN_DAYS = 30;
const PLAN_PRICE_RUB = 199;

/**
 * POST /api/plus/subscribe — оформить подписку «Лапка+».
 *
 * MVP без платёжного шлюза: «оплата» — заглушка. Запрос активирует план
 * на 30 дней и фиксирует покупку в таблице Purchase (без реального списания).
 */
export async function POST(req: Request) {
  if (!(await rateLimit(ipKey(req, "plus"), 10, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const planUntil = new Date(Date.now() + PLAN_DAYS * 24 * 3600 * 1000);

  await db.user.update({
    where: { id: user.id },
    data: { plan: "plus", planUntil },
  });

  await db.purchase.create({
    data: { userId: user.id, kind: "plus", amountRub: PLAN_PRICE_RUB },
  });

  return NextResponse.json({ ok: true, planUntil });
}
