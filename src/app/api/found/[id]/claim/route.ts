import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { censorProfanity } from "@/lib/profanity";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// «Это моя собака»: владелец сообщает нашедшему, что узнал свою собаку. Главный
// путь связи, когда у находки нет публичных контактов (есть только аккаунт
// нашедшего). Уведомляем нашедшего сообщением заявителя (он сам решает, какой
// контакт указать в тексте — приватность на его стороне).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  if (!(await rateLimit(ipKey(req, "claim"), 10, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const b = await req.json().catch(() => ({}));
  const message =
    typeof b?.message === "string" ? b.message.trim().slice(0, 1000) : "";
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Опишите примету и оставьте контакт — хотя бы пару фраз." },
      { status: 400 },
    );
  }

  const found = await db.foundReport.findUnique({ where: { id } });
  if (!found) {
    return NextResponse.json({ error: "Находка не найдена" }, { status: 404 });
  }
  if (!found.userId) {
    return NextResponse.json(
      { error: "У этой находки нет аккаунта нашедшего — свяжитесь по контактам на странице." },
      { status: 400 },
    );
  }
  if (found.userId === user.id) {
    return NextResponse.json(
      { error: "Нельзя заявить права на собственную находку." },
      { status: 400 },
    );
  }

  await notifyUser(found.userId, {
    type: "found",
    title: "Возможно, нашёлся хозяин! 🐾",
    body: `${user.name} узнал(а) собаку: ${censorProfanity(message)}`,
    link: `/found/${id}`,
  });

  return NextResponse.json({ ok: true });
}
