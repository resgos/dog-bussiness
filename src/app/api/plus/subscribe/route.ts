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
  // hasOwnProperty, а не TIER_PRICES_RUB[tier]: иначе tier="__proto__"/"toString"
  // вернёт унаследованное значение (объект/функцию, truthy) → гард пройдёт →
  // бесплатная подписка + рассинхрон (план есть, оплаты нет).
  if (!Object.prototype.hasOwnProperty.call(TIER_PRICES_RUB, tier)) {
    return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });
  }
  const priceRub = TIER_PRICES_RUB[tier];

  const now = new Date();
  const planUntil = new Date(now.getTime() + PLAN_DAYS * 24 * 3600 * 1000);

  // Атомарный CAS: включаем план только если он ещё не активен. При гонке двух
  // параллельных запросов ровно ОДИН получит count===1 → ровно одна запись в
  // Purchase (без двойного списания). Заодно это и идемпотентность двойного клика.
  const claimed = await db.user.updateMany({
    where: {
      id: user.id,
      OR: [{ plan: { not: "plus" } }, { planUntil: null }, { planUntil: { lt: now } }],
    },
    data: { plan: "plus", planUntil },
  });
  if (claimed.count === 0) {
    // Подписка уже активна (или гонка проиграна) — повторно не списываем.
    return NextResponse.json({ ok: true, planUntil: user.planUntil, already: true });
  }

  await db.purchase.create({
    data: { userId: user.id, kind: "plus", refId: tier, amountRub: priceRub },
  });

  return NextResponse.json({ ok: true, planUntil });
}
