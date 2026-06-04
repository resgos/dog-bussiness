"use client";

import { useEffect } from "react";

/** Регистрирует service worker для web-push (без запроса разрешений). */
export function PushRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
