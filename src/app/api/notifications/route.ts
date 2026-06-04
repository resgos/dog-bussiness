import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Лента уведомлений для колокольчика в шапке.
// Не залогинен → пустая лента (колокольчик просто не показывает счётчик).
export async function GET(req: Request) {
  void req;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], unread: 0 });
  }

  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.notification.count({
      where: { userId: user.id, read: false },
    }),
  ]);

  // createdAt сериализуется в ISO-строку автоматически.
  return NextResponse.json({ items, unread });
}
