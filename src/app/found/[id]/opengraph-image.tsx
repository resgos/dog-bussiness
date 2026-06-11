import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Prisma + fs нужны на сервере → Node-рантайм (не edge).
export const runtime = "nodejs";
export const alt = "Лапка помощи — найдена собака";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Динамическая OG-карточка для шаринга находки: «Найдена собака · приметы ·
// район» помогает быстрее выйти на хозяина через репост. Кириллица — Nunito.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.foundReport
    .findUnique({
      where: { id },
      select: { breed: true, color: true, district: true, status: true },
    })
    .catch(() => null);

  const [fontCyr, fontLat] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/nunito-700.woff")),
    readFile(join(process.cwd(), "src/fonts/nunito-latin-700.woff")),
  ]);

  const isReunited = item?.status === "reunited";
  const districtName = item?.district
    ? findDistrict(item.district)?.name ?? null
    : null;
  const sub = [item?.breed, item?.color, districtName]
    .filter(Boolean)
    .join(" · ");
  const kicker = isReunited ? "Воссоединились" : "Найдена собака";
  const headline = isReunited ? "Снова дома" : "Ищет хозяина";
  const accent = isReunited ? "#3f8456" : "#b35070";
  const tagline = isReunited
    ? "Ещё одна счастливая встреча"
    : "Узнали собаку? Поделитесь — поможем найти хозяина.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          background:
            "linear-gradient(135deg, #FFEFF4 0%, #FFF9F5 55%, #FFF4EA 100%)",
          fontFamily: "Nunito",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "32px",
            fontWeight: 700,
            color: "#b35070",
          }}
        >
          Лапка помощи
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "36px",
              fontWeight: 700,
              color: accent,
              marginBottom: "10px",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "96px",
              fontWeight: 700,
              color: "#3f3a44",
              lineHeight: 1,
            }}
          >
            {headline}
          </div>
          {sub ? (
            <div
              style={{
                display: "flex",
                fontSize: "36px",
                color: "#787169",
                marginTop: "18px",
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: "28px", color: accent }}>
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Nunito", data: fontCyr, weight: 700, style: "normal" },
        // Отдельное имя — иначе satori не использует второй шрифт как глиф-фолбэк.
        { name: "NunitoLatin", data: fontLat, weight: 700, style: "normal" },
      ],
    },
  );
}
