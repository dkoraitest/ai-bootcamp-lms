# Supabase schema audit — 2026-08-03

Источник: удаленный Supabase REST API проекта из `.env.local`, с `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Ограничение: anon key не дает доступ к PostgREST OpenAPI и `information_schema`. Полный список типов колонок, constraints, indexes, RLS policies и точные SQL-определения функций нужно дополнительно снять через Supabase SQL Editor или database connection string. Этот аудит подтверждает доступные через REST таблицы/колонки и наличие части RPC.

## Итог

- Таблиц `cohorts` и `cohort_members` в удаленной БД нет.
- `cohort_id` отсутствует во всех целевых таблицах: `student_progress`, `assignment_submissions`, `gamification`, `agent_launches`, `platform_visits`, `project_votes`, `peer_reviews`, `user_notifications`.
- Production-схема `materials` ближе к `supabase/materials_migration.sql`, а не к `supabase/migrations/001_initial.sql`: есть `lesson_topic`, `url`, `description`; нет `content_url`.
- Часть `security definer` RPC доступна через anon key и возвращает данные без пользовательской сессии. Перед фичей потоков это нужно закрыть явными проверками роли/доступа внутри RPC.
- Remote-сигнатура `increment_points` соответствует варианту `p_user_id`, `p_points`, а не локальному вызову с `user_id`, `amount`.

## Таблицы и колонки

### `users`

Есть:

- `id`
- `email`
- `name`
- `avatar_url`
- `goal`
- `created_at`

### `lessons`

Есть:

- `id`
- `week`
- `lesson_number`
- `title`
- `topic`
- `has_homework`
- `video_url`
- `lesson_date`

Нет:

- `cohort_id`

### `materials`

Есть:

- `id`
- `title`
- `type`
- `week`
- `lesson_id`
- `lesson_topic`
- `url`
- `description`
- `markdown_content`

Нет:

- `content_url`
- `cohort_id`

### `assignments`

Есть:

- `id`
- `lesson_id`
- `title`
- `description`
- `checklist`
- `rubric`
- `deadline`
- `hw_number`

Нет:

- `cohort_id`

### `student_progress`

Есть:

- `id`
- `user_id`
- `lesson_id`
- `status`
- `completed_at`

Нет:

- `cohort_id`

### `assignment_submissions`

Есть:

- `id`
- `user_id`
- `assignment_id`
- `github_url`
- `video_url`
- `live_url`
- `artifact`
- `feedback`
- `points_earned`
- `status`
- `submitted_at`

Нет:

- `cohort_id`

### `gamification`

Есть:

- `id`
- `user_id`
- `points`
- `level`
- `badges`
- `quests`

Нет:

- `cohort_id`

### `agent_launches`

Есть:

- `id`
- `user_id`
- `launched_at`
- `week_number`

Нет:

- `cohort_id`

### `platform_visits`

Есть:

- `id`
- `user_id`
- `visit_date`
- `week_number`
- `created_at`

Нет:

- `cohort_id`

### `project_votes`

Есть:

- `id`
- `voter_id`
- `votee_id`
- `score`
- `created_at`
- `updated_at`

Нет:

- `cohort_id`

### `peer_reviews`

Есть:

- `id`
- `reviewer_id`
- `submission_id`
- `checklist_scores`
- `comment`
- `created_at`

Нет:

- `cohort_id`

### `user_notifications`

Есть:

- `id`
- `user_id`
- `title`
- `body`
- `kind`
- `metadata`
- `created_at`

Нет:

- `cohort_id`

### `cohorts`

Таблица не найдена в schema cache.

### `cohort_members`

Таблица не найдена в schema cache.

## RPC probe

Проверено через anon REST-запросы. Персональные данные, которые вернули некоторые функции, не сохранялись в аудит.

| RPC | Статус | Вывод |
| --- | --- | --- |
| `get_my_assignment_submissions()` | `200` | Функция есть, без сессии возвращает пустой список. |
| `get_my_notifications()` | `200` | Функция есть, без сессии возвращает пустой список. |
| `get_assignment_submissions_feed()` | `400 Forbidden` | Функция есть, проверка роли срабатывает. |
| `get_leaderboard()` | `200` | Функция есть и возвращает рейтинг через anon key. Нужно закрыть или параметризовать `p_cohort_id` + доступ. |
| `get_students_for_voting()` | `200` | Функция есть, без сессии возвращает пустой список. |
| `get_my_project_votes()` | `200` | Функция есть, без сессии возвращает пустой список. |
| `get_project_votes_results()` | `200` | Функция есть и возвращает результаты через anon key. Нужно закрыть admin/expert-проверкой. |
| `get_final_course_ratings()` | `200` | Функция есть и возвращает финальный рейтинг через anon key. Нужно закрыть admin/expert-проверкой. |
| `submit_project_votes(votes)` | `400 Not authenticated` | Функция есть, auth-проверка срабатывает. |
| `submit_student_assignment(...)` | `400 Not authenticated` | Функция есть, auth-проверка срабатывает. |
| `submit_expert_feedback(...)` | `400 Student not found` | Функция есть, но anon-запрос дошел до бизнес-логики. Нужно добавить проверку `is_admin_or_expert()`. |
| `review_assignment_submission(...)` | `400 Forbidden` | Функция есть в Supabase, хотя определения нет в tracked SQL-файлах. Нужно выгрузить определение. |
| `increment_points(user_id, amount)` | `404` | Такой сигнатуры нет в remote schema cache. |
| `increment_points(p_user_id, p_points)` | `409 FK violation` | Такая сигнатура есть; вызов дошел до записи в `gamification`. Нужно закрыть от прямого anon-вызова или оставить только внутреннее использование. |
| `award_badge(p_user_id, p_badge_id)` | `204` | Функция доступна через anon key. Нужно закрыть от прямого вызова или оставить только внутреннее использование. |

## Что обязательно снять через SQL Editor

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'users',
    'lessons',
    'materials',
    'assignments',
    'student_progress',
    'assignment_submissions',
    'gamification',
    'agent_launches',
    'platform_visits',
    'peer_reviews',
    'user_notifications',
    'project_votes'
  )
order by table_name, ordinal_position;
```

```sql
select conname, conrelid::regclass as table_name, pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;
```

```sql
select routine_name, pg_get_function_arguments(p.oid) as args, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by routine_name, args;
```

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Решения для миграции потоков

- Не использовать локальный `001_initial.sql` как единственный источник правды.
- Миграцию `008_cohorts.sql` писать после сверки типов из SQL Editor.
- Добавить `cohort_id` в персональные таблицы и `user_notifications`.
- Для `materials` читать потоковую видимость через `cohort_material_settings` и не полагаться на широкое `authenticated read`.
- Все `security definer` RPC переопределить с `p_cohort_id` и явными проверками доступа.
- Удалить или закрыть старые RPC без `cohort_id` после frontend-деплоя.
