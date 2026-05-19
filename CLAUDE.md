# CLAUDE.md

Этот файл — контекст для Claude Code (claude.ai/code) при работе с репозиторием.

## Проект

LMS для 6-недельного AI Agent Bootcamp (12 уроков, 6 ДЗ, геймификация, peer review).

**Repo:** https://github.com/dkoraitest/ai-bootcamp-lms
**Стек:** Next.js 14.2 (App Router), TypeScript, Tailwind CSS 3, Supabase (auth + Postgres), деплой на Vercel.
**UI:** shadcn/ui (стиль base-nova), Lucide icons, Inter (latin + cyrillic).
**Язык интерфейса:** русский — весь пользовательский текст на русском.

## Команды

```bash
npm run dev      # dev-сервер на :3000
npm run build    # production-сборка (ловит TS-ошибки)
npm run lint     # ESLint
```

Тестов нет. `npm run build` — основная проверка корректности.

## Окружение

Нужен `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Архитектура

### Группы маршрутов

- `(auth)/` — `/login`, `/register` (публичные, без layout)
- `(dashboard)/` — все защищённые страницы: `/` (главная), `/program`, `/materials`, `/assignments`, `/progress`, `/skills`, `/peer-review`, `/search`

### Авторизация

`src/middleware.ts` через `@supabase/ssr` проверяет сессию на каждый запрос. Без авторизации — редирект на `/login`; авторизованный на auth-страницах — редирект на `/`. Если Supabase env-переменные не заданы — middleware пропускает запрос.

### Supabase-клиенты

Два фабричных метода — важно использовать правильный:
- `src/lib/supabase/client.ts` — браузерный (`createBrowserClient`), для хуков и client-компонентов
- `src/lib/supabase/server.ts` — серверный (`createServerClient`), для server-компонентов и middleware

### Слой данных

Студенческие данные загружаются через клиентские хуки в `src/lib/hooks/`:
- `useUser` — состояние авторизации (обёртка над `supabase.auth`)
- `useStudentData` — прогресс, сабмиты, запуски, геймификация (параллельные запросы)
- `useContentUrls` — URL видео уроков и материалы

Сдача ДЗ и проверка — через Supabase RPC-функции, не прямые запросы к таблицам:
- `submit_student_assignment` — upsert сабмита + создание уведомления
- `get_my_assignment_submissions` — сабмиты текущего студента
- `get_my_notifications` — уведомления студента (лимит 5)
- `get_assignment_submissions_feed` — очередь для admin/expert (проверка роли через JWT `app_metadata.role`)
- `submit_expert_feedback` — эксперт ставит оценку + начисляет баллы
- `increment_points` — начисление очков в геймификации

### Роли

Роль хранится в `auth.users.app_metadata.role`. Две повышенные: `admin` и `expert` — обе видят `AdminSubmissionQueue` на странице ДЗ. Обычные студенты видят форму сдачи.

### Геймификация

Бейджи выдаются автоматически через Postgres-триггеры (`supabase/triggers.sql`) на таблицах `student_progress`, `assignment_submissions`, `agent_launches`, `peer_reviews`. Очки начисляются через `increment_points` RPC. Уровни: Новичок → Практик → Агент → Мастер → Эксперт.

### Расписание

Даты уроков и дедлайны ДЗ захардкожены в `src/app/(dashboard)/page.tsx` (`LESSONS_SCHEDULE`, `DEADLINES_SCHEDULE`) и `src/app/(dashboard)/assignments/page.tsx` (`INITIAL_ASSIGNMENTS`). Буткемп: 2026-05-12 — 2026-06-18.

### База данных

Миграции в `supabase/migrations/`. Основные таблицы: `users`, `lessons`, `materials`, `assignments`, `student_progress`, `assignment_submissions`, `agent_launches`, `gamification`, `peer_reviews`, `user_notifications`. RPC-функции в `supabase/functions.sql`, триггеры бейджей в `supabase/triggers.sql`.

`assignment_submissions.assignment_id` мигрирован с UUID на int (миграция 002) под `hw_number`. Используется как простой integer, не FK.

### Дизайн-токены

Brand-цвет — indigo/purple `#4f46e5`. CSS-переменные в `src/app/globals.css` (`:root`). В `tailwind.config.ts` `accent` всё ещё указывает на старый синий `#2563eb` — компоненты и CSS-переменные уже используют `#4f46e5`.

### Компоненты (src/components/)

- `layout/` — Sidebar, TopBar, MobileNav (оболочка приложения)
- `dashboard/` — виджеты главной (NextStepBanner, ProgressWidget, GamificationWidget, UpcomingEvents, QuickLinks, LaunchTracker)
- `assignments/` — карточки ДЗ, фильтры, очередь проверки для админов, панель уведомлений
- `materials/` — карточки материалов, фильтр по неделям, табы по типу
- `program/` — блоки недель, карточки уроков/ДЗ, прогресс-бар
- `progress/` — статистика, уровень, бейджи, график активности, квесты
- `search/` — результаты поиска с подсветкой текста
