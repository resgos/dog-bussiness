import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { findDistrict } from "@/lib/districts";

// Prisma + fs нужны на сервере → Node-рантайм (не edge).
export const runtime = "nodejs";
export const alt = "Лапка помощи — розыск собаки";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Динамическая OG-карточка для шаринга объявления о пропаже: «Разыскивается
// {кличка}» с районом и наградой работает как виральный канал поиска — ссылка
// в мессенджере/соцсети превращается в заметный плакат. Кириллица — Nunito.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await db.lostReport
    .findUnique({
      where: { id },
      select: {
        petName: true,
        breed: true,
        district: true,
        status: true,
        reward: true,
      },
    })
    .catch(() => null);

  // Два сабсета одной гарнитуры: satori подбирает глифы по всем шрифтам
  // (кириллица + латиница/пунктуация, иначе «·» рендерится тофу).
  const [fontCyr, fontLat] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/nunito-700.woff")),
    readFile(join(process.cwd(), "src/fonts/nunito-latin-700.woff")),
  ]);

  const isFound = report?.status === "found";
  const name = report?.petName ?? "Собака";
  const districtName = report?.district
    ? findDistrict(report.district)?.name ?? null
    : null;
  const sub = [report?.breed, districtName].filter(Boolean).join(" · ");
  const kicker = isFound ? "Нашлась!" : "Разыскивается";
  const accent = isFound ? "#3f8456" : "#ef6461";
  const tagline = isFound
    ? "Спасибо, что искали вместе!"
    : report?.reward
      ? `Награда ${report.reward.toLocaleString("ru-RU")} руб. · поделитесь!`
      : "Помогите вернуть домой — поделитесь!";

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
