import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Поставить/снять лайк (toggle). Только для залогиненных пользователей.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Войдите, чтобы ставить лайки" },
      { status: 401 },
    );
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
  });

  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
  } else {
    await db.postLike.create({ data: { postId: id, userId: user.id } });
  }

  const likes = await db.postLike.count({ where: { postId: id } });
  return NextResponse.json({ ok: true, liked: !existing, likes });
}
