import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savePhoto } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const pets = await db.pet.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ pets });
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Кличка обязательна" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" && v ? v : null);

  const pet = await db.pet.create({
    data: {
      name: name.slice(0, 80),
      breed: str(body.breed),
      sex: str(body.sex),
      age: str(body.age),
      size: str(body.size),
      color: str(body.color),
      marks: JSON.stringify(asArray(body.marks)),
      chip: str(body.chip),
      marksText: str(body.marksText),
      district: str(body.district),
      address: str(body.address),
      walkSpots: JSON.stringify(asArray(body.walkSpots)),
      temperament: JSON.stringify(asArray(body.temperament)),
      ownerPhone: str(body.ownerPhone),
      extraPhone: str(body.extraPhone),
      telegram: str(body.telegram),
      showPhone: Boolean(body.showPhone),
      photo: await savePhoto(str(body.photo)),
      photoHash: str(body.photoHash),
    },
  });

  return NextResponse.json({ id: pet.id }, { status: 201 });
}
