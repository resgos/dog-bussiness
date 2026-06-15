import { Hero } from "@/components/landing/Hero";
import { Values } from "@/components/landing/Values";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import { WhyUs } from "@/components/landing/WhyUs";
import { ReunionsTeaser } from "@/components/landing/ReunionsTeaser";
import { PulseTeaser } from "@/components/landing/PulseTeaser";
import { ShopTeaser } from "@/components/landing/ShopTeaser";
import { FinalCta } from "@/components/landing/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

// Корень структурированных данных: бренд (Organization) и сайт (WebSite) для
// knowledge-panel и понимания Google. Per-page Article/BreadcrumbList — на
// детальных страницах (/lost, /found, /p).
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Лапка помощи",
  url: SITE_URL,
  logo: absoluteUrl("/icons/icon-192.png"),
  description:
    "Городское сообщество собачников Москвы для оперативного поиска потерявшихся собак.",
  areaServed: { "@type": "City", name: "Москва" },
};
const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Лапка помощи",
  url: SITE_URL,
  inLanguage: "ru-RU",
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={orgLd} />
      <JsonLd data={siteLd} />
      <Hero />
      <Values />
      <HowItWorks />
      <Stats />
      <WhyUs />
      <PulseTeaser />
      <ReunionsTeaser />
      <ShopTeaser />
      <FinalCta />
    </>
  );
}
