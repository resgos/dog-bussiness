import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const sighting = await db.sighting.create({
    data: {
      reportId: str(b?.reportId),
      lat: num(b?.lat),
      lng: num(b?.lng),
      comment: str(b?.comment),
      photo: str(b?.photo),
    },
  });
  return NextResponse.json({ id: sighting.id }, { status: 201 });
}
