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

  // Toggle лайка атомарно: пробуем создать запись (liked=true). Если она уже есть,
  // Prisma бросает P2002 (нарушение @@unique([postId, userId])) — значит лайк уже
  // стоял, снимаем его (liked=false). Это защищает от гонки/двойного клика.
  let liked: boolean;
  try {
    await db.postLike.create({ data: { postId: id, userId: user.id } });
    liked = true;
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      await db.postLike.deleteMany({ where: { postId: id, userId: user.id } });
      liked = false;
    } else {
      throw e;
    }
  }

  const likes = await db.postLike.count({ where: { postId: id } });
  return NextResponse.json({ ok: true, liked, likes });
}
