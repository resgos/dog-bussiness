import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";
import { SEARCH_STEP_KEYS } from "@/lib/searchSteps";

export const dynamic = "force-dynamic";

// POST /api/checklist — сохранить отмеченные шаги поиска. Только владелец пропажи.
export async function POST(req: Request) {
  if (!(await rateLimit(ipKey(req, "checklist"), 30, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  if (!reportId) {
    return NextResponse.json({ error: "Не указано объявление" }, { status: 400 });
  }

  // Принимаем только известные ключи шагов, без дублей.
  const valid = Array.isArray(body.steps)
    ? [
        ...new Set(
          body.steps.filter(
            (k: unknown): k is string =>
              typeof k === "string" && SEARCH_STEP_KEYS.includes(k),
          ),
        ),
      ]
    : [];

  const report = await db.lostReport.findUnique({ where: { id: reportId } });
  if (!report || report.userId !== user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await db.lostReport.update({
    where: { id: reportId },
    data: { checklist: JSON.stringify(valid) },
  });

  return NextResponse.json({ ok: true, steps: valid });
}
