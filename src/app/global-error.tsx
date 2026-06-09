"use client";

// Срабатывает только при ошибке в самом корневом layout — поэтому рендерит
// собственные <html>/<body> с инлайн-стилями (вне дизайн-системы).
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF9F5",
          color: "#3f3a44",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Что-то сломалось 🐾
          </h1>
          <p style={{ color: "#8b8390", marginBottom: "1.5rem" }}>
            Шуня уже чинит. Попробуй обновить страницу.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#FACEA2",
              color: "#4a4a4a",
              border: 0,
              borderRadius: 999,
              padding: "0.7rem 1.4rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
