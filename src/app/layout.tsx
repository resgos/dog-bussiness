import type { Metadata, Viewport } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
    description:
      "Поднимем весь район за 60 секунд. Каждый хвост на учёт.",
    type: "website",
    locale: "ru_RU",
    siteName: "Лапка помощи",
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
};

export default function RootLayout({
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
