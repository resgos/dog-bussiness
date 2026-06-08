import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE — удалить запись дневника здоровья. Только владелец питомца.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const record = await db.healthRecord.findUnique({
    where: { id },
    include: { pet: true },
  });

  // Нет записи или питомец чужой — отдаём 404, не раскрывая чужие данные.
  if (!record || record.pet.userId !== user.id) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  await db.healthRecord.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
