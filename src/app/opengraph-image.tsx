import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";

// Prisma + fs нужны на сервере → Node-рантайм (не edge).
export const runtime = "nodejs";
export const alt = "Лапка помощи — поиск потерявшихся собак в Москве";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Корневая (сайтовая) OG-карточка: главная и все страницы без собственной OG
// (гайды, лента, пульс, магазин…) при шаринге превращаются в брендовый плакат
// с тэглайном и живой статистикой вместо квадратного логотипа. Кириллица —
// Nunito (два сабсета: satori подбирает глифы по обоим шрифтам).
export default async function Image() {
  const [active, reunions] = await Promise.all([
    db.lostReport.count({ where: { status: "active" } }).catch(() => 0),
    db.reunion.count().catch(() => 0),
  ]);

  const [fontCyr, fontLat] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/nunito-700.woff")),
    readFile(join(process.cwd(), "src/fonts/nunito-latin-700.woff")),
  ]);

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
            fontSize: "34px",
            fontWeight: 700,
            color: "#b35070",
          }}
        >
          🐾 Лапка помощи
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "88px",
              fontWeight: 700,
              color: "#3f3a44",
              lineHeight: 1.05,
            }}
          >
            Поднимем район
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "88px",
              fontWeight: 700,
              color: "#ef6461",
              lineHeight: 1.05,
            }}
          >
            за 60 секунд
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              color: "#787169",
              marginTop: "22px",
            }}
          >
            Городское сообщество поиска собак · Москва
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "32px",
            color: "#787169",
          }}
        >
          <span style={{ color: "#ef6461", fontWeight: 700, marginRight: "12px" }}>
            {active}
          </span>
          <span style={{ marginRight: "28px" }}>в розыске сейчас</span>
          <span style={{ color: "#3f8456", fontWeight: 700, marginRight: "12px" }}>
            {reunions}
          </span>
          <span>уже дома</span>
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
