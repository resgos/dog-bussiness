import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "sos" | "sos-outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blush disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Главная кнопка — пастельно-оранжевый из лого (ТЗ: «Кнопки. Важно!»)
  primary:
    "bg-paw text-ink shadow-soft hover:bg-paw-deep hover:shadow-lift active:translate-y-px",
  secondary:
    "bg-card text-ink border-2 border-blush hover:border-petal hover:text-petal-deep",
  ghost: "bg-transparent text-ink hover:bg-blush-soft",
  sos: "bg-status-lost text-white shadow-lift hover:brightness-105 active:translate-y-px",
  // Подчинённый SOS на hero: красный контур, но не перетягивает первичную кнопку
  "sos-outline":
    "bg-card text-status-lost-ink border-2 border-status-lost-ink/45 hover:bg-status-lost-ink/8 active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-lg",
};

export function buttonStyles(opts?: {
  variant?: Variant;
  size?: Size;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
