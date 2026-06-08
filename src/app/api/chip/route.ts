import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";
import { rateLimit, ipKey } from "@/lib/ratelimit";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET /api/chip?n=643... — поиск владельца по номеру микрочипа.
export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get("n");
  const digits = String(n ?? "").replace(/\D/g, "");

  // Слишком короткий ввод — не считаем за валидный номер чипа.
  if (digits.length < 6) {
    return NextResponse.json({ found: false });
  }

  if (!rateLimit(ipKey(req, "chip"), 20, 60_000)) {
    return NextResponse.json({ found: false }, { status: 429 });
  }

  const pet = await db.pet.findFirst({
    where: { chip: digits },
    select: {
      id: true,
      name: true,
      status: true,
      district: true,
      photo: true,
      breed: true,
      showPhone: true,
      ownerPhone: true,
      telegram: true,
      userId: true,
    },
  });

  if (!pet) {
    return NextResponse.json({ found: false });
  }

  // Контакты раскрываем только с согласия владельца.
  const contact = pet.showPhone
    ? { phone: pet.ownerPhone, telegram: pet.telegram }
    : null;
  const district = pet.district ? findDistrict(pet.district)?.name ?? null : null;

  // Подсказываем владельцу, что его чип проверили — возможно, собаку нашли.
  if (pet.userId) {
    try {
      await notifyUser(pet.userId, {
        type: "found",
        title: "Ваш чип проверили 🔎",
        body: `Кто-то проверил номер чипа ${pet.name}. Возможно, вашу собаку нашли — будьте на связи.`,
        link: `/p/${pet.id}`,
      });
    } catch {
      // Уведомление не должно влиять на результат поиска.
    }
  }

  return NextResponse.json({
    found: true,
    pet: {
      id: pet.id,
      name: pet.name,
      status: pet.status,
      breed: pet.breed,
      district,
      photo: pet.photo,
    },
    contact,
  });
}
