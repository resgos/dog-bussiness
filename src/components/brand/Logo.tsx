import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  showText = true,
  size = 44,
}: {
  className?: string;
  showText?: boolean;
  size?: number;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Лапка помощи — на главную"
    >
      <Image
        src="/brand/logo.png"
        alt="Лапка помощи"
        width={size}
        height={size}
        priority
        className="transition-transform duration-300 group-hover:-rotate-6"
      />
      {showText ? (
        <span className="font-display text-xl font-bold leading-none text-ink">
          Лапка{" "}
          <span className="text-petal-deep">помощи</span>
        </span>
      ) : null}
    </Link>
  );
}
