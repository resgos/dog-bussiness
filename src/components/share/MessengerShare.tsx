import { absoluteUrl } from "@/lib/seo";

/**
 * Кнопки репоста в мессенджеры (deep-links). На десктопе navigator.share часто
 * лишь копирует ссылку, а в РФ репост в Telegram/ВК/WhatsApp решает виральность —
 * а виральность и есть главный механизм поиска собаки. Это чистые <a>-ссылки,
 * без клиентского JS: рендерятся на сервере, crawlable, работают без гидрации.
 */
export function MessengerShare({
  path,
  text,
}: {
  path: string;
  text: string;
}) {
  const url = absoluteUrl(path);
  const e = encodeURIComponent;
  const channels = [
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${e(url)}&text=${e(text)}`,
    },
    {
      name: "ВКонтакте",
      href: `https://vk.com/share.php?url=${e(url)}&title=${e(text)}`,
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${e(`${text} ${url}`)}`,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Поделиться в мессенджерах"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm font-semibold text-ink-soft">Репост:</span>
      {channels.map((c) => (
        <a
          key={c.name}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-petal-deep transition-colors hover:border-petal hover:bg-blush-soft"
        >
          {c.name}
        </a>
      ))}
    </div>
  );
}
