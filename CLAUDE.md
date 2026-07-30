# «Лапка помощи» (dog-bussiness) — инструкции для Claude Code

Платформа поиска потерянных собак по Москве: SOS-объявления, лента найденных/потерянных,
карта наблюдений, QR-паспорт питомца, комьюнити, магазин мерча. Репо `github.com/resgos/dog-bussiness`.

Общие правила работы со мной — в `~/.claude/CLAUDE.md`.

## Ветка — исключение из общего правила

Здесь разработка идёт **прямо в `main`**, и это осознанно. Хук `main-branch-guard` пропускает
этот репо по allowlist (`~/.claude/hooks/allow-main-repos.txt`) — в остальных проектах коммит
в main блокируется.

## Стек и жёсткие пины

Next.js **15.5.19** (pinned), React 19.2, TypeScript, Tailwind v4, Framer Motion, lucide-react;
шрифты Comfortaa (display) + Nunito (body). Prisma 5.22 + PostgreSQL 16.

**Пины под Node 20.8.1 — не обновлять:** Next 16 требует Node ≥ 20.9, а 15.5.19 — это
пропатченный backport с закрытыми CVE. Vitest 2.1.9 (Vitest 3 требует Node ≥ 20.12).
Тесты идут в окружении **node**, не jsdom: транзитивный `@exodus/bytes` — ESM-only, а
`require()` ESM на этом Node не поддерживается, поэтому DOM-тестов нет.

## Команды и порты

| Что | Команда / порт |
|---|---|
| dev-сервер | `npx next dev -p 3002 -H 0.0.0.0` (`-H` — чтобы отвечал и на 127.0.0.1, и на ::1) |
| БД + Redis | `docker compose up -d` → `lapka-pg` на **5433**, `lapka-redis` на 6379 |
| миграции / сид / studio | `npm run db:migrate` / `db:seed` / `db:studio` |
| гейты | `npm run lint` → `npm test` → `npm run build` |

Демо-логин: `anya` / `demo1234`. `DATABASE_URL` — в `.env.example`.

## Главная грабля: Prisma EPERM

`npx prisma generate` падает с `EPERM: operation not permitted, rename
query_engine-windows.dll.node`, **пока жив dev-сервер на :3002** — запущенный процесс держит
файл движка. `prisma db push` аддитивную таблицу применит и без generate, но клиент не получит
модель, и ни API, ни verify-скрипты её не увидят.

**Следствие:** любая схема-миграция = остановить :3002 → `db push` + `generate` → поднять :3002.
Это **supervised**-операция, НЕ для автономного цикла. В автолупе делать только read-only или
аддитивные-без-схемы фичи. Фичи, требующие новой таблицы (например `DistrictSubscription` —
подписка на район), лежат в дорожной карте README как supervised.

## Восстановление стека после ребута машины

Симптом: `:3002` ECONNREFUSED **и** Prisma «Can't reach database server at localhost:5433»
одновременно — это не твоя правка, это ребут. По порядку:
1. `Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"`, ждать `docker info` (~15 с);
2. `docker compose up -d` в папке проекта;
3. поднять dev-сервер самому (фоновой задачей).

Проверка БД: `db.product.count()` → на демо-сиде 6.

## Дизайн и контент

Палитра: cream `#FFF9F5`, petal `#E6A4B4`, paw-buttons `#FACEA2`, blush `#FCD9E2`.
Маскот — корги **Шуня** на РЕАЛЬНОМ арте (заказчик отверг упрощение до SVG): позы вырезаны
color-key'ом в прозрачные `pose-*-cut.png`, компонент `ShunyaLive` даёт дыхание/покачивание,
наклон к курсору и смену поз кросс-фейдом.

**Важно:** `next/image` с `loading="eager"` и первый кадр без анимации — ленивые/fade-in
картинки не грузятся и застывают в фоновой вкладке. Общее правило отсюда: **не прятать
above-the-fold контент за JS-анимацию** — hero-текст должен быть виден статически.

Массивы (`marks`, `walkSpots`, `temperament`) хранятся JSON-строками — наследие SQLite,
у которого нет scalar lists.

## Как работать

Для объёмных задач — `/batch` с параллельными субагентами. Рабочий паттерн: фундамент и общие
контракты (схема, `src/lib/auth.ts`) делает оркестратор сам → агенты работают по непересекающимся
путям и НЕ запускают сборку → оркестратор собирает и чинит интеграцию.
