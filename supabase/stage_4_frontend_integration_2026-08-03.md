# Stage 4: Frontend integration

Дата: 2026-08-03

## Результат

Страницы и общие hooks подключены к `activeCohortId`. Переключение потока теперь меняет читаемые и записываемые данные, а не только подпись в интерфейсе.

Изменено:

- dashboard, program, assignments, progress, skills, materials, peer-review и project voting используют cohort-aware queries/RPC;
- admin projects и final ratings используют текущий privileged-контракт `get_available_cohorts()`;
- `recordVisit` и `recordLaunch` записывают `cohort_id`;
- расчёт внутреннего `week_number` получает `cohorts.starts_at`, а UI не показывает день/неделю для потока без даты старта;
- leaderboard, project votes, ratings, notifications, submissions и feedback получают `p_cohort_id`;
- расписание читается из `cohort_lesson_schedule` и `cohort_assignment_schedule`;
- для flow 2 без опубликованного расписания нет дат, дедлайнов или ссылки на запись flow 1;
- материалы и записи читаются только через cohort settings;
- прогресс уроков маппит `lessons.lesson_number` на UUID `lessons.id` и использует cohort-aware upsert conflict target;
- регистрация больше не пишет gamification напрямую из браузера.

## Registration bootstrap

Добавлена и применена через Supabase MCP миграция `011_registration_cohort_bootstrap`:

- создаёт public profile;
- добавляет нового пользователя в `flow-1` как student;
- создаёт cohort-scoped gamification row;
- выполняется trigger-ом после создания `auth.users`;
- клиентская форма регистрации больше не зависит от RLS для этих записей.

Remote verification через MCP подтвердил наличие migration, функции `handle_new_auth_user_cohort` и trigger `on_auth_user_created_cohort_bootstrap`.

## Проверки

- `npx tsc --noEmit --pretty false` — успешно;
- `npm run build` — успешно;
- `git diff --check` — успешно.

## Остаточный риск

Фактические даты flow 2 ещё не внесены, поэтому его расписание и материалы остаются закрытыми. Перед открытием flow 2 нужен Stage 5 smoke/QA прогон для ролей student, expert и admin, включая прямые запросы к Supabase и запись progress/points.
