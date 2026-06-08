import { Hero } from "@/components/landing/Hero";
import { Values } from "@/components/landing/Values";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import { WhyUs } from "@/components/landing/WhyUs";
import { ReunionsTeaser } from "@/components/landing/ReunionsTeaser";
import { ShopTeaser } from "@/components/landing/ShopTeaser";
import { FinalCta } from "@/components/landing/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Values />
      <HowItWorks />
      <Stats />
      <WhyUs />
      <ReunionsTeaser />
      <ShopTeaser />
      <FinalCta />
    </>
  );
}
