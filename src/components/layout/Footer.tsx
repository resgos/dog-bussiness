import Link from "next/link";
import { Heart, Send } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { primaryNav, secondaryNav, profileNav } from "@/lib/nav";

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-ink-soft transition-colors hover:text-petal-deep"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-blush bg-blush-soft/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              Городское сообщество собачников Москвы. Поднимаем район за 60
              секунд, чтобы ни одна собака не оставалась потерянной дольше
              одного дня.
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-petal-deep shadow-card">
              🐾 Каждый хвост на учёт
            </p>
          </div>

          <FooterColumn title="Сервис" items={primaryNav} />
          <FooterColumn title="Личный кабинет" items={profileNav} />

          <div className="space-y-4">
            <FooterColumn title="Ещё" items={secondaryNav} />
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-petal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-petal-deep"
            >
              <Send className="size-4" aria-hidden />
              Telegram-бот района
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-blush pt-6 text-sm text-ink-soft sm:flex-row">
          <p>© {new Date().getFullYear()} Лапка помощи. Москва.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="transition-colors hover:text-petal-deep">
              Политика конфиденциальности
            </Link>
            <Link href="/offer" className="transition-colors hover:text-petal-deep">
              Оферта
            </Link>
          </div>
          <p className="inline-flex items-center gap-1.5">
            Сделано с <Heart className="size-4 fill-petal text-petal" aria-hidden /> и
            заботой о хвостах
          </p>
        </div>
      </div>
    </footer>
  );
}
