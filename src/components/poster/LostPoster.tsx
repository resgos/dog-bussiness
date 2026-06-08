"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { findDistrict } from "@/lib/districts";

/** Поля объявления о пропаже, нужные плакату (даты — ISO-строкой из server-компонента). */
type PosterReport = {
  id: string;
  petId: string | null;
  petName: string;
  breed: string | null;
  photo: string | null;
  district: string | null;
  lostAt: string | null;
  comment: string | null;
  reward: number | null;
};

/** Поля связанного питомца — контакты и доп. приметы. */
type PosterPet = {
  photo: string | null;
  color: string | null;
  marksText: string | null;
  ownerPhone: string | null;
  telegram: string | null;
  showPhone: boolean;
} | null;

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

/** «8 июня 2026» — дата пропажи в человекочитаемом виде. */
function formatLostDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function LostPoster({
  report,
  pet,
}: {
  report: PosterReport;
  pet: PosterPet;
}) {
  const districtName = report.district
    ? findDistrict(report.district)?.name ?? null
    : null;
  const lostDate = formatLostDate(report.lostAt);
  const photo = report.photo || pet?.photo || "/shunya/pose-surprised-cut.png";
  const hasPhoto = Boolean(report.photo || pet?.photo);

  // Куда ведёт QR: паспорт питомца (если привязан) либо общая лента пропаж.
  const qrUrl = report.petId
    ? `${SITE}/p/${report.petId}`
    : `${SITE}/feed/lost`;

  // Контакты в открытую — только с согласия владельца (showPhone).
  const showPhone = Boolean(pet?.showPhone && pet?.ownerPhone);

  // «Последний раз видели» — собираем район + дату, что есть.
  const lastSeen = [districtName, lostDate].filter(Boolean).join(", ");

  // Приметы: текст объявления + окрас/особые приметы из паспорта.
  const marks = [report.comment, pet?.color, pet?.marksText]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(" · ");

  return (
    <>
      {/*
        Печать: на бумаге остаётся только плакат (<main>), без шапки/футера сайта.
        print-color-adjust: exact — иначе браузер не печатает фон тревожной шапки
        и яркого бейджа награды, и плакат теряет контраст.
      */}
      <style>{`
        @media print {
          body > :not(main) { display: none !important; }
          main { padding: 0 !important; }
          .no-print { display: none !important; }
          .poster-sheet {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }
          .poster-ink {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 1cm; }
        }
      `}</style>

      <div className="mx-auto max-w-[640px] px-4 py-6 sm:py-10">
        {/* Панель управления — не попадает в печать */}
        <div className="no-print mb-5 flex flex-col gap-3">
          <Link
            href={report.petId ? `/p/${report.petId}` : "/feed/lost"}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-petal-deep hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Link>
          <p className="text-sm text-ink-soft">
            Распечатайте и расклейте в районе пропажи или отправьте в чат
            соседей — чем больше глаз, тем быстрее найдётся.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-paw px-6 py-3 text-base font-semibold text-ink shadow-soft transition-all hover:bg-paw-deep hover:shadow-lift active:translate-y-px"
          >
            <Printer className="size-5" aria-hidden />
            🖨 Печать / Сохранить PDF
          </button>
        </div>

        {/* ——— Сам плакат (А4-пропорции) ——— */}
        <article className="poster-sheet overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
          {/* Шапка тревоги — крупно и контрастно, читается издалека */}
          <header className="poster-ink bg-status-lost px-6 py-7 text-center text-white">
            <p className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
              🆘 Разыскивается
            </p>
            <p className="mt-2 text-base font-semibold uppercase tracking-[0.2em] text-white/90">
              Помогите найти собаку
            </p>
          </header>

          {/* Фото — максимально крупное */}
          <div className="border-b-4 border-status-lost bg-blush-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={
                hasPhoto
                  ? `Фото собаки по кличке ${report.petName}`
                  : "Фото не добавлено"
              }
              className={
                hasPhoto
                  ? "aspect-square w-full object-cover"
                  : "mx-auto aspect-square w-2/3 object-contain p-6 opacity-80"
              }
            />
          </div>

          <div className="flex flex-col gap-5 px-6 py-7">
            {/* Кличка + порода */}
            <div className="text-center">
              <h1 className="text-5xl font-black leading-none sm:text-6xl">
                {report.petName}
              </h1>
              {report.breed ? (
                <p className="mt-2 text-xl font-semibold text-ink-soft">
                  {report.breed}
                </p>
              ) : null}
            </div>

            {/* Где и когда видели в последний раз */}
            {lastSeen ? (
              <div className="rounded-2xl bg-blush-soft px-5 py-4 text-center">
                <p className="inline-flex items-center justify-center gap-2 text-lg font-bold text-ink">
                  <MapPin
                    className="size-5 shrink-0 text-status-lost"
                    aria-hidden
                  />
                  Последний раз видели:
                </p>
                <p className="mt-1 text-xl font-extrabold text-ink">
                  {lastSeen}
                </p>
              </div>
            ) : null}

            {/* Приметы */}
            {marks ? (
              <div className="rounded-2xl border-2 border-blush px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-wide text-petal-deep">
                  Приметы
                </p>
                <p className="mt-1 text-lg leading-relaxed text-ink">{marks}</p>
              </div>
            ) : null}

            {/* Вознаграждение — яркий бейдж */}
            {report.reward ? (
              <div className="poster-ink rounded-2xl bg-paw px-5 py-4 text-center text-ink">
                <p className="text-xl font-black leading-snug">
                  🎁 Вознаграждение нашедшему:{" "}
                  <span className="whitespace-nowrap">
                    {report.reward.toLocaleString("ru")} ₽
                  </span>
                </p>
              </div>
            ) : null}

            {/* Контакты + QR */}
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-blush-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="text-center sm:text-left">
                {showPhone ? (
                  <>
                    <p className="text-base font-bold text-ink">Звоните:</p>
                    <a
                      href={`tel:${(pet?.ownerPhone ?? "").replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-2 text-3xl font-black leading-tight text-status-lost-ink sm:text-4xl"
                    >
                      <Phone className="size-7 shrink-0" aria-hidden />
                      {pet?.ownerPhone}
                    </a>
                    {pet?.telegram ? (
                      <p className="mt-1 text-base font-semibold text-petal-deep">
                        Telegram: {pet.telegram}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="inline-flex items-center gap-2 text-lg font-bold text-ink">
                      <QrCode
                        className="size-5 shrink-0 text-petal-deep"
                        aria-hidden
                      />
                      Сканируйте QR-код
                    </p>
                    <p className="mt-1 max-w-[18rem] text-base text-ink-soft">
                      Увидите паспорт собаки и контакты для связи.
                    </p>
                  </>
                )}
              </div>

              <div className="shrink-0 text-center">
                <div className="poster-ink inline-block rounded-xl bg-white p-2 shadow-card">
                  <QRCodeSVG value={qrUrl} size={160} level="M" />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-ink-soft">
                  Наведите камеру
                </p>
              </div>
            </div>

            {/* Брендинг */}
            <p className="border-t border-blush pt-4 text-center text-sm font-semibold text-ink-soft">
              🐾 Лапка помощи · lapka-pomoshchi.ru
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
