/**
 * Отправить POST с JSON-телом и вернуть разобранный ответ.
 * Бросает Error с текстом из поля `error` ответа (или дефолтным) при статусе !ok.
 * Централизует повторяющийся паттерн fetch + Content-Type + проверка ok + json().
 */
export async function postJson<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || "Не удалось выполнить запрос");
  return data;
}
