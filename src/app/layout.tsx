import type { Metadata, Viewport } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShunyaCompanion } from "@/components/brand/ShunyaCompanion";
import { PushRegister } from "@/components/notifications/PushRegister";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lapka-pomoshchi.ru"),
  title: {
    default: "Лапка помощи — поиск потерявшихся собак в Москве",
    template: "%s · Лапка помощи",
  },
  description:
    "Городское сообщество собачников Москвы. SOS-оповещение соседей за 60 секунд, карта поиска, цифровой паспорт питомца с QR и магазин адресников ручной работы.",
  keywords: [
    "поиск собак",
    "потерялась собака",
    "Москва",
    "адресник",
    "QR паспорт питомца",
    "волонтёры",
  ],
  openGraph: {
    title: "Лапка помощи — поиск потерявшихся собак в Москве",
    description: "Поднимем весь район за 60 секунд. Каждый хвост на учёт.",
    type: "website",
    locale: "ru_RU",
    siteName: "Лапка помощи",
    images: ["/brand/logo.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Лапка помощи",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${comfortaa.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Скип-ссылка (WCAG 2.4.1): первый Tab уводит клавиатуру мимо навигации
            прямо к контенту. Скрыта визуально, появляется при фокусе. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lift"
        >
          Перейти к содержимому
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <ShunyaCompanion />
        <PushRegister />
      </body>
    </html>
  );
}
