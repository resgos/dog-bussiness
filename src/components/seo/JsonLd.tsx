/**
 * Встраивает JSON-LD (schema.org) для богатых результатов в поиске Google.
 * `<` экранируем в <, чтобы значения полей (комментарий владельца и т.п.)
 * не могли разорвать тег <script> и инжектнуть разметку.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
