import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Добавить комментарий к посту. Только для залогиненных пользователей.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Войдите, чтобы комментировать" },
      { status: 401 },
    );
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = typeof body?.text === "string" ? body.text.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Напишите комментарий" }, { status: 400 });
  }
  // Серверный лимит длины (клиентский maxLength можно обойти).
  const text = raw.slice(0, 1000);

  const comment = await db.comment.create({
    data: { postId: id, authorId: user.id, text },
  });

  return NextResponse.json({ ok: true, id: comment.id }, { status: 201 });
}
