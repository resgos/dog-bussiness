"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogIn, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SosButton } from "./SosButton";
import { ButtonLink } from "@/components/ui/Button";
import { primaryNav, secondaryNav } from "@/lib/nav";
import { cn } from "@/lib/cn";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();

  // Закрываем мобильное меню при переходе.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-blush/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Десктоп-навигация */}
        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-blush-soft",
                    isActive(item.href) && "bg-blush text-petal-deep",
                  )}
                >
                  {item.label}
                  <ChevronDown className="size-4 opacity-60" aria-hidden />
                </Link>
                <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="min-w-52 rounded-2xl border border-blush bg-card p-2 shadow-soft">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            "block rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-blush-soft hover:text-ink",
                            isActive(child.href) && "text-petal-deep",
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-blush-soft",
                  isActive(item.href) && "bg-blush text-petal-deep",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* Действия */}
        <div className="flex items-center gap-2">
          <ButtonLink
            href="/auth"
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <LogIn className="size-4" aria-hidden />
            Войти
          </ButtonLink>
          <SosButton size="sm" className="hidden sm:inline-flex" />

          {/* Мобильный тоггл */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush-soft lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {open ? (
        <div className="border-t border-blush bg-cream lg:hidden">
          <nav className="mx-auto w-full max-w-6xl space-y-1 px-4 py-4 sm:px-6">
            {primaryNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-base font-semibold transition-colors hover:bg-blush-soft",
                    isActive(item.href) && "bg-blush text-petal-deep",
                  )}
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <div className="ml-3 border-l border-blush pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-blush-soft hover:text-ink"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-blush-soft px-3.5 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-3">
              <ButtonLink href="/auth" variant="secondary" size="md">
                <LogIn className="size-4" aria-hidden />
                Войти
              </ButtonLink>
              <SosButton size="md" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
