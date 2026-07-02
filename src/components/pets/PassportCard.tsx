"use client";

import Link from "next/link";
import { ArrowLeft, PawPrint, Printer, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { findDistrict } from "@/lib/districts";

/** Поля питомца, нужные печатной QR-бирке на ошейник. */
type CardPet = {
  id: string;
  name: string;
  breed: string | null;
  color: string | null;
  photo: string | null;
  district: string | null;
  chip: string | null;
  status: string;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

/**
 * Печатная QR-бирка: владелец печатает, ламинирует и крепит к ошейнику. Если
 * собака потеряется — нашедший сканирует QR и попадает на паспорт с контактами.
 * Это превентивная сторона QR-паспорта (на странице /p QR раньше не было).
 */
export function PassportCard({ pet }: { pet: CardPet }) {
  const districtName = pet.district
    ? findDistrict(pet.district)?.name ?? null
    : null;
  const qrUrl = `${SITE}/p/${pet.id}`;
  const facts = [pet.breed, pet.color, districtName].filter(Boolean).join(" · ");

  return (
    <>
      {/*
        Печать: на бумаге остаётся только бирка (<main>), без шапки/футера сайта.
        print-color-adjust: exact — иначе браузер не печатает фон шапки и бирка
        теряет контраст.
      */}
      <style>{`
        @media print {
          body > :not(main) { display: none !important; }
          main { padding: 0 !important; }
          .no-print { display: none !important; }
          .card-sheet {
            box-shadow: none !important;
            max-width: 100% !important;
          }
          .card-ink {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="mx-auto max-w-[480px] px-4 py-6 sm:py-10">
        {/* Панель управления — не попадает в печать */}
        <div className="no-print mb-5 flex flex-col gap-3">
          <Link
            href={`/p/${pet.id}`}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-petal-deep hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            К паспорту
          </Link>
          <p className="text-sm text-ink-soft">
            Распечатайте бирку, заламинируйте и прикрепите к ошейнику. Если собака
            потеряется — нашедший наведёт камеру на QR и увидит паспорт с
            контактами.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-paw px-6 py-3 text-base font-semibold text-ink shadow-soft transition-all hover:bg-paw-deep hover:shadow-lift active:translate-y-px"
          >
            <Printer className="size-5" aria-hidden />
            🖨 Печать / Сохранить PDF
          </button>
          {/* Мост «печать → магазин» (P0 #1 бизнес-беклога): бумажная бирка —
              временное решение, гравированный адресник — постоянное. */}
          <p className="text-sm text-ink-soft">
            Бумажная бирка боится дождя —{" "}
            <Link
              href="/shop/addressniki"
              className="font-semibold text-petal-deep hover:underline"
            >
              закажите гравированный адресник с QR
            </Link>{" "}
            в нашем магазине.
          </p>
        </div>

        {/* ——— Сама бирка ——— */}
        <article className="card-sheet overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
          <header className="card-ink flex items-center gap-4 bg-petal px-6 py-5 text-white">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/20">
              {pet.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pet.photo}
                  alt={`Фото питомца ${pet.name}`}
                  className="size-full object-cover"
                />
              ) : (
                <PawPrint className="size-8" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-black leading-none">
                {pet.name}
              </p>
              {facts ? (
                <p className="mt-1 truncate text-sm font-semibold text-white/90">
                  {facts}
                </p>
              ) : null}
            </div>
          </header>

          <div className="flex flex-col items-center gap-4 px-6 py-7 text-center">
            <p className="text-xl font-black text-ink">
              Нашли меня? Отсканируйте 👇
            </p>
            <div className="card-ink inline-block rounded-2xl bg-white p-3 shadow-card">
              <QRCodeSVG value={qrUrl} size={184} level="M" />
            </div>
            <p className="max-w-[20rem] text-sm leading-relaxed text-ink-soft">
              Откроется мой цифровой паспорт с приметами и контактами хозяина.
            </p>

            {pet.chip ? (
              <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                <ScanLine className="size-4 text-petal" aria-hidden />
                Микрочип: <span className="font-mono">{pet.chip}</span>
              </p>
            ) : null}

            <p className="w-full border-t border-blush pt-4 text-sm font-semibold text-ink-soft">
              🐾 Лапка помощи · lapka-pomoshchi.ru
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
