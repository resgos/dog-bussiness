# Деплой «Лапки помощи»

Стек: Next.js 15 (standalone) + PostgreSQL + Prisma. Доставка уведомлений —
web-push (VAPID), e-mail (SMTP), Telegram (опционально).

## 1. Переменные окружения

Скопируй `.env.example` → `.env` и заполни:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | строка подключения к PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | публичный URL (для ссылок в письмах/уведомлениях, og) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | web-push; сгенерировать: `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:` контакт оператора |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` | отправка писем (без `SMTP_HOST` письма пишутся в лог) |
| `TELEGRAM_BOT_TOKEN` | опционально, дублирование уведомлений в Telegram |
| `POSTGRES_PASSWORD` | пароль БД для docker-compose.prod |

> ⚠️ `NEXT_PUBLIC_*` инлайнятся в клиентский бандл **на этапе сборки** —
> в Docker они передаются как build args (см. `docker-compose.prod.yml`),
> а не только в рантайме.

## 2. Запуск через Docker Compose (приложение + БД)

```bash
docker compose -f docker-compose.prod.yml up -d --build
# применить миграции (один раз после старта БД):
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
# (опционально) демо-данные:
docker compose -f docker-compose.prod.yml exec app node prisma/seed.mjs
```

Приложение будет на `http://<host>:3000`. Поставь перед ним reverse-proxy
(nginx/Caddy) с TLS — push-уведомления и Service Worker работают только по HTTPS.

## 3. Только образ приложения

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://lapka-pomoshchi.ru \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-vapid> \
  -t lapka-app .
docker run -p 3000:3000 --env-file .env lapka-app
```

## 4. Миграции и бэкапы

- Накат миграций в проде: `prisma migrate deploy` (не `migrate dev`).
- Бэкап БД: `pg_dump`/`pg_restore` или снапшоты volume `lapka-pgdata`
  (рекомендуется ежедневный дамп по cron).

## 5. Хранилище фото (TODO к продакшену)

Сейчас фото хранятся data URL'ом в БД (MVP). Шов для перехода на объектное
хранилище — `src/lib/storage.ts` (`savePhoto`): при заданном `S3_BUCKET`
добавляется выгрузка в S3/MinIO и возврат https-URL без правок вызывающего кода.

## 6. Чек-лист перед публичным запуском

- [ ] HTTPS + домен (обязательно для web-push/SW).
- [ ] Реальные VAPID/SMTP (и при желании Telegram-бот).
- [ ] Объектное хранилище для фото (S3/MinIO) + миграция с base64.
- [ ] Юр-проверка `/privacy` и `/offer` под 152-ФЗ.
- [ ] Бэкапы БД и мониторинг ошибок (Sentry: `SENTRY_DSN`).
- [ ] Сменить `POSTGRES_PASSWORD` и секреты с дефолтных.
