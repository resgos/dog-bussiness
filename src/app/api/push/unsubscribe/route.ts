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
  if (endpoint) {
    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });
  }
  return NextResponse.json({ ok: true });
}
