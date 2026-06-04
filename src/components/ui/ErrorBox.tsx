import type { ReactNode } from "react";

/** Единый блок ошибки формы — красная плашка с ролью alert. */
export function ErrorBox({ message }: { message?: ReactNode }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm font-medium text-status-lost"
    >
      {message}
    </p>
  );
}
