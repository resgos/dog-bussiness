import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Типы сервисов-партнёров (как в каталоге «Сервисы рядом»).
const PARTNER_TYPES = ["vet", "groomer", "hotel", "trainer", "shop"] as const;

/** Обрезает строку до значимой и ограничивает длину; иначе null. */
const str = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

// POST — приём B2B-заявки на размещение сервиса. Гость может подать (вход не нужен).
export async function POST(req: Request) {
  if (!(await rateLimit(ipKey(req, "partner"), 5, 60_000))) {
    return NextResponse.json(
      { error: "Слишком часто — попробуйте через минуту." },
      { status: 429 },
    );
  }

  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const name = str(b.name, 120);
  if (!name) {
    return NextResponse.json(
      { error: "Укажите название сервиса" },
      { status: 400 },
    );
  }

  const type = typeof b.type === "string" ? b.type : "";
  if (!(PARTNER_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: "Выберите тип сервиса" },
      { status: 400 },
    );
  }

  // Заявку может подать и авторизованный партнёр — привяжем e-mail при наличии.
  const user = await getCurrentUser().catch(() => null);

  const { id } = await db.partner.create({
    data: {
      name,
      type,
      district: str(b.district, 80),
      address: str(b.address, 200),
      phone: str(b.phone, 40),
      url: str(b.url, 200),
      description: str(b.description, 1000),
      contactEmail: str(b.contactEmail, 120) ?? user?.email ?? null,
      status: "pending",
      featured: false,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
