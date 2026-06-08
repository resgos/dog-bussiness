"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/http";

export function DeleteAccount() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/account/delete", {});
      // Сессия уже погашена на сервере — уводим на главную.
      window.location.href = "/";
    } catch {
      setError("Не удалось удалить аккаунт. Попробуй ещё раз.");
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-status-lost"
          aria-hidden
        />
        <span>
          Удаление аккаунта <strong className="text-ink">безвозвратно</strong>:
          мы навсегда сотрём твой профиль, питомцев и историю (право на забвение,
          152-ФЗ). Уже опубликованные объявления о пропаже и находке{" "}
          <strong className="text-ink">останутся анонимно</strong> — чтобы стая
          могла продолжить поиск.
        </span>
      </p>

      {!confirm ? (
        <div className="mt-4">
          <Button variant="sos-outline" onClick={() => setConfirm(true)}>
            <Trash2 className="size-4" aria-hidden />
            Удалить аккаунт
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-status-lost/30 bg-status-lost/5 p-4">
          <p className="text-sm font-semibold text-status-lost-ink">
            Точно удалить? Это действие нельзя отменить.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="sos" onClick={remove} disabled={busy}>
              <Trash2 className="size-4" aria-hidden />
              {busy ? "Удаляю…" : "Да, удалить навсегда"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirm(false)}
              disabled={busy}
            >
              <X className="size-4" aria-hidden />
              Отмена
            </Button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-status-lost">{error}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
