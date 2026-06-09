import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Данные текущего пользователя для шапки. Вынесено в API, чтобы корневой layout
// не читал cookies() — тогда статичные страницы (гайды, о проекте) кэшируются.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, unread: 0 });
  }
  const unread = await db.notification.count({
    where: { userId: user.id, read: false },
  });
  return NextResponse.json({ user: { name: user.name }, unread });
}
