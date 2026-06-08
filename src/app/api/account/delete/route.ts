import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Удаление аккаунта (152-ФЗ «право на забвение»). Стираем все личные данные
// пользователя одной транзакцией. Публичные объявления о пропаже/находке
// не удаляем — они нужны стае для поиска — а лишь анонимизируем (userId → null).
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Порядок важен: сначала зависимые записи (FK), затем сам пользователь.
    await db.$transaction([
      db.pushSubscription.deleteMany({ where: { userId } }),
      db.passwordResetToken.deleteMany({ where: { userId } }),
      db.notification.deleteMany({ where: { userId } }),
      db.postLike.deleteMany({ where: { userId } }),
      db.postLike.deleteMany({ where: { post: { authorId: userId } } }),
      db.comment.deleteMany({ where: { authorId: userId } }),
      db.comment.deleteMany({ where: { post: { authorId: userId } } }),
      db.post.deleteMany({ where: { authorId: userId } }),
      db.orderItem.deleteMany({ where: { order: { userId } } }),
      db.order.deleteMany({ where: { userId } }),
      db.lostReport.updateMany({ where: { userId }, data: { userId: null } }),
      db.foundReport.updateMany({ where: { userId }, data: { userId: null } }),
      db.pet.deleteMany({ where: { userId } }),
      db.session.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    await destroySession();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось удалить аккаунт. Попробуй ещё раз." },
      { status: 500 },
    );
  }
}
