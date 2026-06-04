import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  const endpoint = typeof b?.endpoint === "string" ? b.endpoint : null;
  const p256dh = typeof b?.keys?.p256dh === "string" ? b.keys.p256dh : null;
  const auth = typeof b?.keys?.auth === "string" ? b.keys.auth : null;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }
  await db.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh, auth },
    create: { userId: user.id, endpoint, p256dh, auth },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
