/**
 * Абстракция хранилища фотографий с переключаемым драйвером (STORAGE_DRIVER):
 *   • datauri — фото остаётся data URL'ом в БД (MVP, без файлов);
 *   • local   — self-hosted: декодируем data URL и пишем файл на диск (UPLOAD_DIR),
 *               возвращаем путь /api/uploads/<file>; дедуп по контент-хэшу;
 *   • (s3 / kts) — задел на переезд в облако: тот же savePhoto, без правок вызовов.
 *
 * Переезд на КТС (облако): добавить ветку драйвера здесь + задать STORAGE_DRIVER —
 * вызывающий код (`await savePhoto(...)`) не меняется.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, isAbsolute } from "node:path";

const DRIVER = process.env.STORAGE_DRIVER ?? "datauri";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function parseDataUrl(s: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(s);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), buf: Buffer.from(m[2], "base64") };
}

function uploadDir(): string {
  return isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : join(process.cwd(), UPLOAD_DIR);
}

/**
 * Сохраняет фото и возвращает ссылку/значение для хранения в БД.
 * Уже-ссылки (`http(s)://…` или `/…`) и не-data-URL возвращаются как есть.
 */
export async function savePhoto(input: string | null): Promise<string | null> {
  if (!input) return null;
  if (/^(https?:\/\/|\/)/.test(input)) return input;

  if (DRIVER === "local") {
    const parsed = parseDataUrl(input);
    if (!parsed) return input;
    const ext = MIME_EXT[parsed.mime] ?? "bin";
    // Имя = контент-хэш → одинаковые фото дедуплицируются.
    const name = `${createHash("sha1").update(parsed.buf).digest("hex")}.${ext}`;
    try {
      const dir = uploadDir();
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), parsed.buf);
      return `/api/uploads/${name}`;
    } catch {
      // Сбой записи — не теряем фото, откатываемся к data URL.
      return input;
    }
  }

  // datauri (и будущие s3/kts до их реализации): храним как есть.
  return input;
}

/** Максимальный размер фото-инпута (data URL) — чтобы не раздувать БД. */
export const MAX_PHOTO_BYTES = 3_000_000;

/**
 * Пригоден ли фото-инпут к сохранению: пусто (фото опционально) или уже-ссылка
 * (savePhoto вернёт её как есть) — ок; иначе обязан быть data:image в пределах
 * лимита. POST-роуты используют это для ответа 400 на не-image и гигантские
 * data URL — savePhoto размер НЕ проверяет, без гарда это вектор DB-блоата/DoS.
 */
export function isStorablePhoto(input: string | null | undefined): boolean {
  if (!input) return true;
  if (/^(https?:\/\/|\/)/.test(input)) return true;
  return input.startsWith("data:image") && input.length <= MAX_PHOTO_BYTES;
}
