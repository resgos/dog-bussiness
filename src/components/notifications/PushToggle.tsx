"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** Включение/выключение web-push для текущего пользователя. */
export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID
    ) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setOn(Boolean(sub)))
      .catch(() => {});
  }, []);

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Разрешение не выдано — включи уведомления в настройках браузера.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error();
      setOn(true);
    } catch {
      setMsg("Не получилось включить. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setOn(false);
    } catch {
      setMsg("Не получилось отключить.");
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-soft text-petal-deep">
        {on ? <BellRing className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
      </span>
      <div className="mr-auto min-w-[12rem]">
        <p className="font-bold text-ink">Push-уведомления о пропажах рядом</p>
        <p className="text-sm text-ink-soft">
          {on
            ? "Включены — узнаешь первым, даже когда сайт закрыт."
            : "Получай SOS-сигналы соседей мгновенно на телефон."}
        </p>
        {msg ? <p className="mt-1 text-sm text-status-lost">{msg}</p> : null}
      </div>
      {on ? (
        <Button variant="secondary" onClick={disable} disabled={busy}>
          <BellOff className="size-4" aria-hidden />
          {busy ? "…" : "Отключить"}
        </Button>
      ) : (
        <Button onClick={enable} disabled={busy}>
          <BellRing className="size-4" aria-hidden />
          {busy ? "Включаю…" : "Включить"}
        </Button>
      )}
    </div>
  );
}
