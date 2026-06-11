import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Право на доступ к своим персональным данным (152-ФЗ): пользователь скачивает
// копию всего, что создал в «Лапке», одним JSON-файлом. Только свои данные,
// без секретов (passwordHash/токены сессий не отдаём).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const uid = user.id;

  const [
    pets,
    lostReports,
    foundReports,
    sightings,
    posts,
    comments,
    reunions,
    orders,
    purchases,
  ] = await Promise.all([
    db.pet.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.lostReport.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.foundReport.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.sighting.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.post.findMany({ where: { authorId: uid }, orderBy: { createdAt: "desc" } }),
    db.comment.findMany({ where: { authorId: uid }, orderBy: { createdAt: "desc" } }),
    db.reunion.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({
      where: { userId: uid },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    db.purchase.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    format: "lapka-data-export-v1",
    // Профиль — без passwordHash и токенов сессий.
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      district: user.district,
      telegram: user.telegram,
      role: user.role,
      plan: user.plan,
      planUntil: user.planUntil,
      helpedCount: user.helpedCount,
      referralCode: user.referralCode,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    },
    pets,
    lostReports,
    foundReports,
    sightings,
    posts,
    comments,
    reunions,
    orders,
    purchases,
  };

  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lapka-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
