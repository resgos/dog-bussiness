import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Срок подписки «Лапка+» — 30 дней с момента оформления.
const PLAN_DAYS = 30;
// Тарифы (P3 #13): личный и семейный (до 5 аккаунтов — механика приглашений
// семьи появится позже; перки в MVP одинаковые). Маркер тарифа — Purchase.refId.
const TIER_PRICES_RUB: Record<string, number> = { solo: 199, family: 299 };

/**
 * POST /api/plus/subscribe — оформить подписку «Лапка+».
 * Body: { tier?: "solo" | "family" } (по умолчанию solo — обратная
 * совместимость).
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

  const body = (await req.json().catch(() => null)) as {
    tier?: unknown;
  } | null;
  const tier = typeof body?.tier === "string" ? body.tier : "solo";
  const priceRub = TIER_PRICES_RUB[tier];
  if (!priceRub) {
    return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });
  }

  // Идемпотентность: уже активная подписка не списывается повторно и не теряет
  // остаток дней (защита от двойного клика/повтора).
  if (
    user.plan === "plus" &&
    user.planUntil &&
    new Date(user.planUntil).getTime() > Date.now()
  ) {
    return NextResponse.json({ ok: true, planUntil: user.planUntil, already: true });
  }

  const planUntil = new Date(Date.now() + PLAN_DAYS * 24 * 3600 * 1000);

  await db.user.update({
    where: { id: user.id },
    data: { plan: "plus", planUntil },
  });

  await db.purchase.create({
    data: { userId: user.id, kind: "plus", refId: tier, amountRub: priceRub },
  });

  return NextResponse.json({ ok: true, planUntil });
}
