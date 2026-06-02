import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/shop", label: "Все товары", key: "all" },
  { href: "/shop/addressniki", label: "🏷️ Адресники", key: "addressniki" },
  { href: "/shop/bracelets", label: "💫 Браслеты", key: "bracelets" },
];

/** Горизонтальная навигация по разделам магазина. */
export function CategoryNav({ active = "all" }: { active?: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((l) => {
        const isActive = l.key === active;
        return (
          <Link
            key={l.key}
            href={l.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-5 text-sm font-semibold transition-colors",
              isActive
                ? "border-petal bg-blush text-petal-deep"
                : "border-blush bg-card text-ink hover:border-petal hover:text-petal-deep",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
