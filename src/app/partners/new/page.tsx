import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PartnerForm } from "@/components/partners/PartnerForm";

export const metadata = { title: "Разместить сервис" };

export default function PartnerNewPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Badge tone="paw">
          <Star className="size-3.5" aria-hidden />
          Партнёрам
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Разместите свой сервис
        </h1>
        <p className="mt-2 text-ink-soft">
          Ветклиники, груминг, передержка, кинологи и зоомагазины — попадите в
          каталог «Сервисы рядом» и получите доступ к вовлечённой аудитории
          собачников вашего района.
        </p>

        <ShunyaBubble
          className="mt-6"
          message={
            <>
              Наши соседи открывают «Лапку» каждый день — гуляют, ищут, заботятся
              о питомцах. Разместитесь рядом, и они найдут именно вас. Заявка
              бесплатная, модерация быстрая!
            </>
          }
        />

        <div className="mt-6 rounded-3xl border border-blush bg-blush-soft px-5 py-4">
          <p className="inline-flex items-center gap-2 font-bold text-petal-deep">
            <Star className="size-4" aria-hidden />
            Промо-размещение — 990 ₽/мес
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Featured-карточка закрепляется в топе каталога с бейджем «Рекомендуем»
            — вас видят первыми. Базовая заявка всегда бесплатна; промо подключим
            после модерации.
          </p>
        </div>

        <div className="mt-8">
          <PartnerForm />
        </div>
      </div>
    </Container>
  );
}
