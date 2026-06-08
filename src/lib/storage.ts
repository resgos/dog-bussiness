/**
 * Абстракция хранилища фотографий.
 *
 * Сейчас (MVP) фото приходит data URL'ом и хранится как есть в БД — функция
 * работает как passthrough, поведение не меняется. Это «шов»: при заданном
 * S3-окружении (S3_BUCKET и ключи) здесь добавляется выгрузка в объектное
 * хранилище и возврат публичного https-URL — без правок вызывающего кода.
 */
const S3_BUCKET = process.env.S3_BUCKET;

export async function savePhoto(input: string | null): Promise<string | null> {
  if (!input) return null;
  // Уже внешняя ссылка (или путь в /public) — оставляем как есть.
  if (/^(https?:\/\/|\/)/.test(input)) return input;

  if (S3_BUCKET) {
    // TODO(prod): декодировать data URL, загрузить в S3 (@aws-sdk/client-s3)
    // и вернуть `https://<bucket>/<key>`. Включается при наличии бакета и ключей.
  }
  // MVP-фолбэк: храним data URL как есть.
  return input;
}
