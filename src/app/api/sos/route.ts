import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savePhoto } from "@/lib/storage";
import { censorProfanity } from "@/lib/profanity";
import { notifyMany } from "@/lib/notify";
import { sendTelegramChannel } from "@/lib/telegram";
import { rateLimit, ipKey } from "@/lib/ratelimit";
import { rankFoundForLost } from "@/lib/match";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const petName = b && typeof b.petName === "string" ? b.petName.trim() : "";
  if (!petName) {
    return NextResponse.json({ error: "Выбери питомца" }, { status: 400 });
  }
  if (!(await rateLimit(ipKey(req, "sos"), 5, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  // Текущий пользователь (если залогинен) — привязываем к нему объявление,
  // чтобы он мог вести/закрывать поиск и получать уведомления о наблюдениях.
  const me = await getCurrentUser();

  const radius = Number(b.radiusKm);
  // Подтягиваем размер/окрас из карточки питомца — для матчинга и фильтров ленты.
  const petId = str(b.petId);
  const pet = petId
    ? await db.pet.findUnique({
        where: { id: petId },
        select: { size: true, color: true, photoHash: true },
      })
    : null;
  const report = await db.lostReport.create({
    data: {
      userId: me?.id ?? null,
      petId,
      petName: censorProfanity(petName.slice(0, 80)) ?? petName.slice(0, 80),
      breed: str(b.breed),
      size: pet?.size ?? null,
      color: pet?.color ?? null,
      photo: await savePhoto(str(b.photo)),
      photoHash: pet?.photoHash ?? str(b.photoHash),
      district: str(b.district),
      lat: num(b.lat),
      lng: num(b.lng),
      lostAt: b.lostAt ? new Date(b.lostAt) : new Date(),
      comment: censorProfanity(str(b.comment)),
      radiusKm: [1, 3, 5, 10].includes(radius) ? radius : 3,
      reward:
        typeof b.reward === "number" && b.reward > 0
          ? Math.min(Math.round(b.reward), 1_000_000)
          : null,
      status: "active",
    },
  });

  // Оповещаем соседей того же района о пропаже. Рассылка вынесена в try/catch:
  // любой сбой здесь не должен мешать созданию объявления.
  if (report.district) {
    try {
      const neighbours = await db.user.findMany({
        where: { district: report.district },
        select: { id: true },
        take: 200,
      });
      const recipients = neighbours.filter((u) => u.id !== me?.id);

      if (recipients.length > 0) {
        const details = [report.breed, report.district, report.comment]
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
          .join(" · ");

        await notifyMany(
          recipients.map((u) => u.id),
          {
            type: "sos",
            title: `Рядом пропал ${report.petName}`,
            body: details || "Помогите найти — каждая минута на счету.",
            link: "/feed/lost",
          },
        );
      }
    } catch {
      /* рассылка не критична — игнорируем */
    }
  }

  // Умный алерт: новая пропажа может совпасть с уже открытыми находками —
  // оповестим нашедших, чтобы они связались с владельцем (симметрично /api/found:
  // там при находке оповещаем владельцев совпавших пропаж). Только сильные
  // совпадения, чтобы не спамить.
  try {
    const founds = await db.foundReport.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const matches = rankFoundForLost(report, founds, 40);
    const finderIds = [
      ...new Set(
        matches
          .map((m) => m.item.userId)
          .filter(
            (uid): uid is string => Boolean(uid) && uid !== report.userId,
          ),
      ),
    ];
    if (finderIds.length) {
      await notifyMany(finderIds, {
        type: "found",
        title: "Возможно, вашу находку ищут! 🔎",
        body: "Рядом подали в розыск собаку, похожую на найденную вами. Загляните — вдруг это её хозяин.",
        link: "/feed/lost",
      });
    }
  } catch {
    /* алерт некритичен — игнорируем */
  }

  // Бродкаст в районный Telegram-канал (no-op без настроенного бота/канала).
  {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const line = [report.breed, report.district].filter(Boolean).join(" · ");
    const text = [
      `🆘 Пропал: ${report.petName}`,
      line,
      report.comment || "",
      report.reward ? `🎁 Награда: ${report.reward} ₽` : "",
      base ? `Плакат и контакты: ${base}/poster/${report.id}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await sendTelegramChannel(text);
  }

  return NextResponse.json({ id: report.id }, { status: 201 });
}
