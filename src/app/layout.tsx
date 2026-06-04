import type { Metadata, Viewport } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShunyaCompanion } from "@/components/brand/ShunyaCompanion";
import { PushRegister } from "@/components/notifications/PushRegister";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
  const user = await getCurrentUser();
  const unread = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${comfortaa.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header user={user ? { name: user.name } : null} unread={unread} />
        <main className="flex-1">{children}</main>
        <Footer />
        <ShunyaCompanion />
        <PushRegister />
      </body>
    </html>
  );
}
