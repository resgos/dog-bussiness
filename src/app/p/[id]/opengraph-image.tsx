import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Prisma + fs нужны на сервере → Node-рантайм (не edge).
export const runtime = "nodejs";
export const alt = "Лапка помощи — паспорт питомца";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Динамическая OG-карточка для шаринга паспорта: персональная картинка
// «Разыскивается {кличка}» сильнее работает как виральный канал поиска,
// чем общая статичная картинка. Кириллица — через встроенный Nunito.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await db.pet
    .findUnique({
      where: { id },
      select: { name: true, breed: true, district: true, status: true },
    })
    .catch(() => null);

  // Два сабсета одной гарнитуры: satori подбирает глифы по всем переданным
  // шрифтам (кириллица + латиница/пунктуация, иначе «·» рендерится тофу).
  const [fontCyr, fontLat] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/nunito-700.woff")),
    readFile(join(process.cwd(), "src/fonts/nunito-latin-700.woff")),
  ]);

  const isLost = pet?.status === "lost";
  const name = pet?.name ?? "Питомец";
  const districtName = pet?.district
    ? findDistrict(pet.district)?.name ?? null
    : null;
  const sub = [pet?.breed, districtName].filter(Boolean).join(" · ");
  const kicker = isLost
    ? "Разыскивается"
    : pet?.status === "found"
      ? "Нашлась"
      : "Цифровой паспорт";
  const accent = isLost ? "#ef6461" : "#b35070";

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
              fontSize: "104px",
              fontWeight: 700,
              color: "#3f3a44",
              lineHeight: 1,
            }}
          >
            {name}
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

        <div style={{ display: "flex", fontSize: "28px", color: "#787169" }}>
          {isLost
            ? "Помогите вернуть домой — поделитесь!"
            : "Каждый хвост на учёт"}
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
