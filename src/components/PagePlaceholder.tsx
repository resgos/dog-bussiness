import { ArrowLeft, Hammer, PawPrint } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import type { Placeholder } from "@/lib/placeholders";

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  shunyaSays,
  features,
  shunyaSrc,
}: Placeholder) {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="petal">{eyebrow}</Badge>
          <Badge tone="paw">
            <Hammer className="size-3.5" aria-hidden />
            Раздел в разработке
          </Badge>
        </div>

        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{description}</p>

        {shunyaSays ? (
          <ShunyaBubble
            message={shunyaSays}
            src={shunyaSrc}
            className="mt-8"
          />
        ) : null}

        {features?.length ? (
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">
              Что появится здесь
            </h2>
            <ul className="mt-4 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-ink">
                  <PawPrint
                    className="mt-1 size-4 shrink-0 text-petal"
                    aria-hidden
                  />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10">
          <ButtonLink href="/" variant="ghost">
            <ArrowLeft className="size-4" aria-hidden />
            На главную
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
