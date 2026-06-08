import { ScanLine } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ChipSearch } from "@/components/chip/ChipSearch";

export const metadata = { title: "Проверить чип" };

export default function ChipPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Badge tone="petal">🔖 Микрочип</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Проверить номер чипа
        </h1>
        <p className="mt-2 text-ink-soft">
          Нашли собаку с микрочипом? Введите номер — найдём владельца в базе
          „Лапки“ и подскажем национальные реестры.
        </p>

        <div className="mt-8">
          <ChipSearch />
        </div>

        <div className="mt-10 rounded-3xl border border-blush bg-blush-soft p-6">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-ink">
            <ScanLine className="size-5 text-petal" aria-hidden />
            Что такое чип
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Микрочип — это крошечная капсула с ISO-номером из 15 цифр под кожей
            собаки. Её считывает бесплатный сканер в любой ветклинике. Снаружи
            чип не виден, но это самый надёжный способ доказать, чья собака, и
            вернуть её домой.
          </p>
        </div>
      </div>
    </Container>
  );
}
