import { Siren } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Крупная заметная кнопка SOS (ТЗ 4.3). Ведёт в режим создания объявления. */
export function SosButton({
  size = "md",
  withLabel = true,
  variant = "sos",
  className,
}: {
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  variant?: "sos" | "sos-outline";
  className?: string;
}) {
  return (
    <ButtonLink
      href="/sos"
      variant={variant}
      size={size}
      className={cn("group", className)}
      aria-label="Сообщить о пропаже — режим SOS"
    >
      <Siren
        className="size-[1.15em] transition-transform duration-300 group-hover:scale-110"
        aria-hidden
      />
      {withLabel ? "SOS" : null}
    </ButtonLink>
  );
}
