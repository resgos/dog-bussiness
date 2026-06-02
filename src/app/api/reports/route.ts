import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const where =
    status === "lost" || status === "active"
      ? { status: "active" }
      : status === "found"
        ? { status: "found" }
        : {};

  const reports = await db.lostReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { sightings: true },
  });

  return NextResponse.json({ reports });
}
