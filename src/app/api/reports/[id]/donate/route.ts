import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Донат на награду (P1 #4 бизнес-беклога): соседи скидываются на награду
// конкретного розыска — деньги района работают на поиск. Как и буст, это
// MVP-заглушка без платёжного шлюза: пишем Purchase (kind="reward-donation",
// refId=розыск), сумма пула = сумма таких записей. Донат доступен любому
// вошедшему, пока розыск активен.
const ALLOWED_AMOUNTS = [100, 300, 500];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await rateLimit(ipKey(req, "donate"), 10, 60_000))) {
    return NextResponse.json({ error: "Слишком часто." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    amountRub?: unknown;
  } | null;
  const amountRub = Number(body?.amountRub);
  if (!ALLOWED_AMOUNTS.includes(amountRub)) {
    return NextResponse.json(
      { error: "Недопустимая сумма" },
      { status: 400 },
    );
  }

  const report = await db.lostReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Розыск не найден" }, { status: 404 });
  }
  if (report.status !== "active") {
    return NextResponse.json(
      { error: "Розыск уже закрыт" },
      { status: 400 },
    );
  }

  await db.purchase.create({
    data: { userId: user.id, kind: "reward-donation", refId: id, amountRub },
  });

  const total = await db.purchase.aggregate({
    where: { kind: "reward-donation", refId: id },
    _sum: { amountRub: true },
  });

  return NextResponse.json({ ok: true, total: total._sum.amountRub ?? 0 });
}
