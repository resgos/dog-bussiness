import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findDistrict } from "@/lib/districts";

export const dynamic = "force-dynamic";

const POST_TYPES = [
  "пропажа",
  "находка",
  "наблюдение",
  "совет",
  "событие",
  "обсуждение",
] as const;

// Создать пост в районной ленте. Автор — текущий пользователь (если залогинен).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Войдите, чтобы публиковать посты" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Напишите текст поста" }, { status: 400 });
  }

  const type = POST_TYPES.includes(body?.type) ? body.type : "обсуждение";
  // Район: либо из формы, либо район пользователя по умолчанию.
  const rawDistrict =
    typeof body?.district === "string" && body.district ? body.district : user.district;
  const district = rawDistrict && findDistrict(rawDistrict) ? rawDistrict : null;

  const post = await db.post.create({
    data: { authorId: user.id, type, district, text },
  });

  return NextResponse.json({ ok: true, id: post.id }, { status: 201 });
}
