import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqLd } from "@/lib/seo";

/**
 * Аккордеон «частые вопросы» на нативном <details> — раскрытие работает без
 * клиентского JS и гидрации, контент crawlable для поисковиков. Видимый список и
 * FAQPage JSON-LD кормятся одним массивом (единый источник, как у крошек).
 */
export function FaqSection({
  title = "Частые вопросы",
  items,
}: {
  title?: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section className="mt-10">
      <JsonLd data={faqLd(items)} />
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <details
            key={it.q}
            className="group rounded-2xl border border-blush bg-card px-5 py-4 shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {it.q}
              <ChevronDown
                className="size-5 shrink-0 text-petal transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-3 leading-relaxed text-ink-soft">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
