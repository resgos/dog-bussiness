"use client";

import { PawPrint, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type FlyerDog = {
  id: string;
  petName: string;
  breed: string | null;
  photo: string | null;
  reward: number | null;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

/**
 * Печатная листовка района: один лист A4 со всеми активными пропажами выбранного
 * района (фото, кличка, награда, QR на объявление). Для волонтёрского обхода —
 * один лист на весь район вместо пачки отдельных плакатов.
 */
export function DistrictFlyer({
  districtName,
  dogs,
}: {
  districtName: string;
  dogs: FlyerDog[];
}) {
  return (
    <>
      <style>{`
        @media print {
          body > :not(main) { display: none !important; }
          main { padding: 0 !important; }
          .no-print { display: none !important; }
          .flyer-sheet { box-shadow: none !important; border: none !important; max-width: 100% !important; }
          .flyer-ink { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0.8cm; }
        }
      `}</style>

      <div className="mx-auto max-w-[820px] px-4 py-6 sm:py-10">
        <div className="no-print mb-5 flex flex-col gap-3">
          <p className="text-sm text-ink-soft">
            Распечатайте и расклейте в районе — на одном листе все, кого ищут
            рядом. Каждый QR ведёт на объявление с фото и контактами.
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

        <article className="flyer-sheet overflow-hidden rounded-3xl border border-blush bg-card shadow-card">
          <header className="flyer-ink bg-status-lost px-6 py-5 text-center text-white">
            <p className="text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
              🆘 Разыскиваются собаки
            </p>
            <p className="mt-1.5 text-base font-semibold uppercase tracking-[0.15em] text-white/90">
              {districtName}
            </p>
          </header>

          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {dogs.map((d) => (
              <div
                key={d.id}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-blush p-3 text-center"
              >
                <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-blush-soft">
                  {d.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={d.photo}
                      alt={`Разыскивается ${d.petName}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-petal">
                      <PawPrint className="size-10" aria-hidden />
                    </span>
                  )}
                </div>
                <p className="text-lg font-black leading-tight text-ink">
                  {d.petName}
                </p>
                {d.breed ? (
                  <p className="-mt-1 text-xs text-ink-soft">{d.breed}</p>
                ) : null}
                {d.reward ? (
                  <p className="text-xs font-bold text-coral">
                    Награда {d.reward.toLocaleString("ru")} ₽
                  </p>
                ) : null}
                <div className="flyer-ink mt-auto rounded-md bg-white p-1 shadow-card">
                  <QRCodeSVG value={`${SITE}/lost/${d.id}`} size={72} level="M" />
                </div>
              </div>
            ))}
          </div>

          <p className="border-t border-blush px-6 py-3 text-center text-sm font-semibold text-ink-soft">
            🐾 Лапка помощи · наведите камеру на QR — увидите фото и контакты
          </p>
        </article>
      </div>
    </>
  );
}
