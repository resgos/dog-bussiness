"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { findDistrict } from "@/lib/districts";
import { sizeOptions } from "@/lib/petForm";

/** Поля находки, нужные плакату (даты — ISO-строкой из server-компонента). */
type PosterFound = {
  id: string;
  breed: string | null;
  color: string | null;
  size: string | null;
  district: string | null;
  photo: string | null;
  comment: string | null;
  finderName: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  createdAt: string;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

function formatDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Печатный плакат «Найдена собака» — зеркало LostPoster для стороны нашедшего. */
export function FoundPoster({ found }: { found: PosterFound }) {
  const districtName = found.district
    ? findDistrict(found.district)?.name ?? null
    : null;
  const sizeLabel =
    sizeOptions.find((o) => o.value === found.size)?.label ?? null;
  const foundDate = formatDate(found.createdAt);
  const photo = found.photo || "/shunya/sm/pose-surprised.png";
  const hasPhoto = Boolean(found.photo);

  const qrUrl = `${SITE}/found/${found.id}`;
  const phone = found.contactPhone?.replace(/[^\d+]/g, "") || null;
  const telegram = found.contactTelegram?.replace(/^@/, "") || null;

  const facts = [found.breed, found.color, sizeLabel].filter(Boolean).join(" · ");
  const whereWhen = [districtName ? `район ${districtName}` : null, foundDate]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {/* Печать: на бумаге остаётся только плакат (<main>), без шапки/футера. */}
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
            href={`/found/${found.id}`}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-petal-deep hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Link>
          <p className="text-sm text-ink-soft">
            Распечатайте и расклейте там, где нашли собаку, или отправьте в чат
            соседей — так хозяин найдётся быстрее.
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

        {/* ——— Сам плакат ——— */}
        <article className="poster-sheet overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
          {/* Шапка «находка» — насыщенно-зелёный фон, белый текст читается издалека */}
          <header className="poster-ink bg-status-found-ink px-6 py-7 text-center text-white">
            <p className="text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
              🔎 Найдена собака
            </p>
            <p className="mt-2 text-base font-semibold uppercase tracking-[0.2em] text-white/90">
              Ищем хозяина
            </p>
          </header>

          <div className="border-b-4 border-status-found-ink bg-blush-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={hasPhoto ? "Фото найденной собаки" : "Фото не добавлено"}
              className={
                hasPhoto
                  ? "aspect-square w-full object-cover"
                  : "mx-auto aspect-square w-2/3 object-contain p-6 opacity-80"
              }
            />
          </div>

          <div className="flex flex-col gap-5 px-6 py-7">
            <div className="text-center">
              <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                {facts || "Найдена собака"}
              </h1>
            </div>

            {whereWhen ? (
              <div className="rounded-2xl bg-blush-soft px-5 py-4 text-center">
                <p className="inline-flex items-center justify-center gap-2 text-lg font-bold text-ink">
                  <MapPin
                    className="size-5 shrink-0 text-status-found-ink"
                    aria-hidden
                  />
                  Где нашли:
                </p>
                <p className="mt-1 text-xl font-extrabold text-ink">
                  {whereWhen}
                </p>
              </div>
            ) : null}

            {found.comment ? (
              <div className="rounded-2xl border-2 border-blush px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-wide text-petal-deep">
                  Приметы
                </p>
                <p className="mt-1 text-lg leading-relaxed text-ink">
                  {found.comment}
                </p>
              </div>
            ) : null}

            {/* Контакты нашедшего + QR */}
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-blush-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="text-center sm:text-left">
                {phone ? (
                  <>
                    <p className="text-base font-bold text-ink">
                      {found.finderName
                        ? `${found.finderName} нашёл(ла) — звоните:`
                        : "Это ваша собака? Звоните:"}
                    </p>
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-2 text-3xl font-black leading-tight text-status-found-ink sm:text-4xl"
                    >
                      <Phone className="size-7 shrink-0" aria-hidden />
                      {found.contactPhone}
                    </a>
                    {telegram ? (
                      <p className="mt-1 text-base font-semibold text-petal-deep">
                        Telegram: @{telegram}
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
                      Откроется объявление с фото и контактами.
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

            <p className="border-t border-blush pt-4 text-center text-sm font-semibold text-ink-soft">
              🐾 Лапка помощи · lapka-pomoshchi.ru
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
