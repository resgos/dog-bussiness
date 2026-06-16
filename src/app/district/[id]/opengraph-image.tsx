import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Prisma + fs нужны на сервере → Node-рантайм (не edge).
export const runtime = "nodejs";
export const alt = "Лапка помощи — собаки района";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Динамическая OG-карточка хаба района: при шаринге страницы района (кнопка
// «Поделиться районом») ссылка превращается в заметный плакат с живыми
// счётчиками — «Район X · N в розыске · M находок». Усиливает виральность
// по тезису «район за районом». Кириллица — Nunito (два сабсета для глифов).
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = findDistrict(id);

  const [active, found] = await Promise.all([
    db.lostReport
      .count({ where: { district: id, status: "active" } })
      .catch(() => 0),
    db.foundReport
      .count({ where: { district: id, status: "open" } })
      .catch(() => 0),
  ]);

  const [fontCyr, fontLat] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/nunito-700.woff")),
    readFile(join(process.cwd(), "src/fonts/nunito-latin-700.woff")),
  ]);

  const name = d?.name ?? "Москва";
  const okrug = d?.okrug ?? null;

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
              color: "#b35070",
              marginBottom: "10px",
            }}
          >
            Район
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
          {okrug ? (
            <div
              style={{
                display: "flex",
                fontSize: "34px",
                color: "#787169",
                marginTop: "18px",
              }}
            >
              {okrug}, Москва
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "34px",
            color: "#787169",
          }}
        >
          <span style={{ color: "#ef6461", fontWeight: 700, marginRight: "12px" }}>
            {active}
          </span>
          <span style={{ marginRight: "28px" }}>в розыске</span>
          <span style={{ color: "#3f8456", fontWeight: 700, marginRight: "12px" }}>
            {found}
          </span>
          <span>находок ждут хозяев</span>
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
