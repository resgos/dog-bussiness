/** Русское склонение по числу. */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

/** «2 часа назад», «вчера», «только что». */
export function timeAgo(input: Date | string, now: number = Date.now()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const sec = Math.floor((now - date.getTime()) / 1000);
  if (sec < 60) return "только что";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} ${plural(min, "минуту", "минуты", "минут")} назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${plural(hr, "час", "часа", "часов")} назад`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "вчера";
  return `${day} ${plural(day, "день", "дня", "дней")} назад`;
}
