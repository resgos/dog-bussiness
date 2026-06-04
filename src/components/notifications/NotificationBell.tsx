"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { postJson } from "@/lib/http";
import { timeAgo } from "@/lib/format";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({ unread: initialUnread }: { unread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications");
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : []);
      setUnread(typeof j?.unread === "number" ? j.unread : 0);
    } catch {
      /* тихо */
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const markAll = async () => {
    try {
      await postJson("/api/notifications/read", {});
    } catch {
      /* тихо */
    }
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Уведомления"
        className="relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-blush-soft"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-status-lost-ink px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-blush bg-card p-2 shadow-soft">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-bold text-ink">Уведомления</span>
            {items.some((i) => !i.read) ? (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-semibold text-petal-deep hover:underline"
              >
                Прочитать все
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-ink-soft">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-soft">
              Пока пусто 🐾
            </p>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {items.map((n) => {
                const inner = (
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-petal",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      {n.body ? (
                        <p className="text-xs leading-snug text-ink-soft">{n.body}</p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className="rounded-xl px-2 py-2 hover:bg-blush-soft">
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-2 py-2 text-center text-xs font-semibold text-petal-deep hover:bg-blush-soft"
          >
            Все уведомления
          </Link>
        </div>
      ) : null}
    </div>
  );
}
