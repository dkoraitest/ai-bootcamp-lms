# План реализации потоков в LMS

## Цель фичи

Добавить в LMS поддержку нескольких потоков курса и переключатель в верхней части интерфейса:

- **Поток 1** — текущий поток. Все существующие данные, материалы, записи, баллы, прогресс, доступы и админские сценарии остаются как сейчас.
- **Поток 2** — новый поток. На старте доступен только администраторам и экспертам. Обычные участники потока 1 не должны видеть поток 2 и не должны иметь возможность получить его данные прямым запросом.
- В потоке 2 не должно быть старых баллов, прогресса, сдач ДЗ, голосований и рейтингов потока 1.
- В потоке 2 нужно убрать ссылки на записи встреч.
- Материалы для потока 2 должны быть отдельно управляемыми: на старте можно скрыть все материалы или открыть только выбранные.

## Почему нужен backend-first подход

Сейчас в проекте нет сущности "поток". Большая часть персональных данных привязана только к `user_id`, а часть контента общая для всех:

- `student_progress` — прогресс уроков.
- `assignment_submissions` — сдачи домашних заданий.
- `gamification` — баллы, уровни, бейджи, квесты.
- `agent_launches` — запуски агентов.
- `platform_visits` — посещения платформы.
- `project_votes` — голосование за проекты.
- `lessons`, `materials` — учебный контент.
- `get_leaderboard()` сейчас завязан на список email участников потока 1.

Если сделать только UI-переключатель, данные потоков будут смешиваться. Поэтому сначала нужно добавить поток в модель данных Supabase, затем подключить UI.

## Что нужно учесть по текущему репозиторию

Фактический Supabase-аудит выполнен через Supabase MCP. Основной файл: `supabase/full_schema_audit_mcp_2026-08-03.md`. Completion-gate этапа 0 зафиксирован в `supabase/stage_0_completion_2026-08-03.md`. Stage 1 apply report зафиксирован в `supabase/stage_1_apply_2026-08-03.md`. Stage 2 draft/apply reports зафиксированы в `supabase/stage_2_draft_2026-08-03.md` и `supabase/stage_2_apply_2026-08-03.md`.

Дополнительные источники:

- первичный remote-probe через anon REST API: `supabase/schema_audit_2026-08-03.md`;
- OpenAPI-аудит через `SERVICE_ROLE_KEY`: `supabase/schema_audit_service_role_2026-08-03.md`.

MCP-аудит подтвердил таблицы, колонки, типы, constraints, indexes, RLS policies, grants, triggers, RPC/functions, advisors и свежие API/Postgres logs. Разрушающие операции не выполнялись, персональные строки/почты/секреты в audit-файлы не сохранены.

Найденные недочеты:

- `materials` описан по-разному: в `001_initial.sql` `id` и `lesson_id` — `uuid`, а в `supabase/materials_migration.sql` и frontend — числовые `id`, `lesson_id`, поля `url`, `lesson_topic`, `description`.
- MCP подтвердил production-схему: `materials.id` и `materials.lesson_id` — `integer`; `lessons.id` и `student_progress.lesson_id` — `uuid`.
- `assignment_submissions.assignment_id` в миграции `002_assignment_submission_flow.sql` переводится из `uuid` в `int` под `hw_number`, но часть SQL всё еще джойнится так, будто `assignment_id` связан с `assignments.id`.
- MCP подтвердил: `assignment_submissions.assignment_id` — `integer`, без FK на `assignments.id`, фактически это `hw_number`; таблица `assignments` в production пустая.
- Страницы программы работают с числовыми lesson id, но прогресс хранится по `lessons.id uuid`. Значит frontend-программа должна либо хранить прогресс по uuid урока, либо явно маппить `lesson_number`/числовой id на `lessons.id`.
- `supabase/functions.sql` и `supabase/triggers.sql` содержат пересекающиеся версии функций `increment_points`, `submit_student_assignment`, `get_my_assignment_submissions`. Нужно выбрать один source of truth для актуальных RPC.
- Frontend вызывает `review_assignment_submission`; в tracked SQL-файлах определение не найдено, но MCP подтвердил функцию в production. Ее нужно перенести в versioned SQL до изменения flow review.
- MCP подтвердил, что `increment_points(p_user_id uuid, p_points int)` и `award_badge(p_user_id uuid, p_badge_id int)` exposed как RPC. Их нужно закрыть от прямого клиентского вызова или добавить строгую проверку прав.
- MCP advisors нашли высокий security debt: все/почти все `SECURITY DEFINER` функции доступны `anon`/`authenticated`, многие функции без фиксированного `search_path`, а таблицы `users`, `platform_visits`, `project_votes`, `user_notifications` имеют RLS enabled, но без policies.
- `submit_expert_feedback` особенно рискованная: production-функция начисляет баллы и обновляет сдачи по email/hw_number без проверки роли. Ее нужно отключить, закрыть grants или заменить на guarded admin/expert RPC.
- `auth.users` и `public.users` расходятся: в `auth.users` 16 записей, в `public.users` 13 профилей, 3 auth users без public profile. Backfill `cohort_members` лучше делать от `auth.users`, а профильные данные подтягивать отдельно.
- Supabase migration history в проекте отсутствует: `list_migrations` пустой, в логах есть ошибка отсутствия `supabase_migrations.schema_migrations`. Любую новую миграцию нужно делать идемпотентной и проверяемой отдельно.
- Часть таблиц ссылается на `public.users`, часть функций читает `auth.users`. Для потоков лучше явно решить: `auth.users` — источник идентичности и ролей, `public.users` — профильные данные/цели, если таблица синхронизирована.
- `src/lib/types.ts` не отражает текущую схему материалов и ДЗ, поэтому типы нужно обновить или не использовать их как основание для SQL-миграции.

Вывод: Stage 0 завершен полностью. До `008_cohorts.sql` нужно не повторять аудит, а использовать `supabase/full_schema_audit_mcp_2026-08-03.md` как schema contract и `supabase/stage_0_completion_2026-08-03.md` как preflight/rollback gate. Все потенциально разрушающие действия нужно согласовать отдельно: удаление/замена constraints, revoke grants, отключение старых RPC.

## Продуктовая логика доступов

Роли:

- `admin` — видит и управляет всеми потоками.
- `expert` — видит оба потока, если мы сохраняем текущую экспертную роль для проверки ДЗ и админских страниц.
- `student` — видит только потоки, где он состоит как участник и которые открыты для студентов.

Правила:

- Участники потока 1 видят только `Поток 1`.
- `Поток 2` в переключателе видят только `admin`/`expert`, пока поток не открыт для студентов.
- Прямые запросы к данным `flow-2` должны блокироваться на уровне Supabase, а не только на уровне React.
- После запуска потока 2 можно будет включить `is_visible_to_students = true` и добавить новых студентов в `cohort_members`.

## Supabase: новая схема

### 1. Таблица потоков

```sql
create table if not exists cohorts (
  id text primary key,
  name text not null,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  is_visible_to_students boolean not null default false,
  created_at timestamptz not null default now()
);

insert into cohorts (id, name, is_visible_to_students)
values
  ('flow-1', 'Поток 1', true),
  ('flow-2', 'Поток 2', false)
on conflict (id) do nothing;
```

### 2. Таблица участников потоков

```sql
create table if not exists cohort_members (
  cohort_id text not null references cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student',
  created_at timestamptz not null default now(),
  primary key (cohort_id, user_id),
  check (role in ('student', 'expert', 'admin'))
);

create index if not exists idx_cohort_members_user_id
  on cohort_members(user_id);
```

### 3. Контент по потокам

Есть два варианта.

Вариант A, быстрый и простой: добавить `cohort_id` прямо в `materials` и `lessons`.

Плюсы: проще фильтровать.
Минусы: если программа одинаковая, появится дублирование записей.

Вариант B, рекомендуемый: оставить базовую программу общей, а настройки доступа вынести в отдельные таблицы.

```sql
create table if not exists cohort_lesson_settings (
  cohort_id text not null references cohorts(id) on delete cascade,
  lesson_number int not null,
  video_url text,
  is_released boolean not null default false,
  released_at timestamptz,
  primary key (cohort_id, lesson_number)
);

create table if not exists cohort_material_settings (
  cohort_id text not null references cohorts(id) on delete cascade,
  material_id int not null references materials(id) on delete cascade,
  is_visible boolean not null default false,
  url text,
  primary key (cohort_id, material_id)
);
```

Рекомендация: выбрать вариант B. Он позволяет оставить программу курса общей, но отдельно управлять записями и видимостью материалов для каждого потока.

Для `flow-1` нужно заполнить текущие ссылки и видимость как сейчас. Для `flow-2` оставить `video_url = null` и `is_visible = false` для всех материалов на старте.

Техническое уточнение перед миграцией: в репозитории есть две версии схемы материалов. В `001_initial.sql` `materials.id` был `uuid`, но `supabase/materials_migration.sql` пересоздает `materials.id` как `int`, и текущий frontend ожидает числовые `id`, `lesson_id`, `url`, `lesson_topic`, `description`. Перед написанием `008_cohorts.sql` нужно сверить фактическую production-схему Supabase и выбрать правильный тип `cohort_material_settings.material_id`.

### 4. Расписание и дедлайны по потокам

У `Потока 2` будет другое расписание, но на момент планирования его еще нет. Поэтому поток 2 не должен автоматически наследовать даты уроков, дедлайны ДЗ и текст "День N / Неделя N" из потока 1.

До Stage 4 расписание и период курса были зашиты на frontend:

- `src/app/(dashboard)/page.tsx` — `BOOTCAMP_START`, `LESSONS_SCHEDULE`, `DEADLINES_SCHEDULE`;
- `src/app/(dashboard)/program/page.tsx` — массив `LESSONS`, даты уроков и дедлайны ДЗ;
- `src/lib/actions/recordVisit.ts` и `src/lib/actions/recordLaunch.ts` — расчет `week_number` от глобального `BOOTCAMP_START`;
- карточки ДЗ используют статичные дедлайны и порядок открытия.

Нужно вынести расписание в потоковые настройки:

```sql
create table if not exists cohort_lesson_schedule (
  cohort_id text not null references cohorts(id) on delete cascade,
  lesson_number int not null,
  lesson_date date,
  starts_at timestamptz,
  title_override text,
  topic_override text,
  is_released boolean not null default false,
  primary key (cohort_id, lesson_number)
);

create table if not exists cohort_assignment_schedule (
  cohort_id text not null references cohorts(id) on delete cascade,
  hw_number int not null,
  deadline timestamptz,
  is_released boolean not null default false,
  primary key (cohort_id, hw_number)
);
```

Правила:

- для `flow-1` заполнить расписание текущими датами 12.05.2026 — 18.06.2026 и текущими дедлайнами;
- для `flow-2` на старте оставить `lesson_date`, `starts_at`, `deadline` пустыми или `is_released = false`;
- если у потока нет расписания, UI должен показывать нейтральное состояние: "Расписание скоро появится", без старых дат потока 1;
- `recordVisit()` и `recordLaunch()` должны считать `week_number` от `cohorts.starts_at` или от потокового расписания, а не от глобального `BOOTCAMP_START`;
- release-логика уроков, ДЗ, записей и материалов должна смотреть на активный `cohort_id`.

Реализовано в Stage 4: UI читает расписание из cohort settings, а `recordVisit()`/`recordLaunch()` используют `cohorts.starts_at` активного потока.

### 5. Добавить `cohort_id` в персональные таблицы

```sql
alter table student_progress
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table assignment_submissions
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table gamification
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table agent_launches
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table platform_visits
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table project_votes
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table peer_reviews
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';

alter table user_notifications
  add column if not exists cohort_id text references cohorts(id) default 'flow-1';
```

После добавления колонок нужно обновить constraints:

- `student_progress`: заменить unique `(user_id, lesson_id)` на `(cohort_id, user_id, lesson_id)`.
- `assignment_submissions`: заменить unique `(user_id, assignment_id)` на `(cohort_id, user_id, assignment_id)`.
- `gamification`: заменить unique `user_id` на unique `(cohort_id, user_id)`.
- `platform_visits`: заменить unique `(user_id, visit_date)` на `(cohort_id, user_id, visit_date)`.
- `project_votes`: заменить unique `(voter_id, votee_id)` на `(cohort_id, voter_id, votee_id)`.
- `peer_reviews`: учитывать `cohort_id` при подсчете ревью и бейджа Peer Reviewer.
- `user_notifications`: фильтровать уведомления по `cohort_id`, иначе сообщения о сдачах потока 1 появятся в потоке 2.

## Supabase: функции доступа

Добавить helper-функции:

```sql
create or replace function is_admin_or_expert()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'expert');
$$;

create or replace function can_access_cohort(p_cohort_id text)
returns boolean
language sql
stable
as $$
  select
    is_admin_or_expert()
    or exists (
      select 1
      from cohort_members cm
      join cohorts c on c.id = cm.cohort_id
      where cm.user_id = auth.uid()
        and cm.cohort_id = p_cohort_id
        and c.is_active = true
        and c.is_visible_to_students = true
    );
$$;
```

Администраторы и эксперты получают доступ ко всем потокам. Студенты получают доступ только к активным и открытым для студентов потокам, где они состоят.

## Supabase: RLS и RPC

Нужно обновить все RPC, которые сейчас возвращают данные без учета потока.

Важно: многие RPC сейчас `security definer`, то есть выполняются с правами владельца и могут обходить RLS. Поэтому безопасность потоков нельзя считать решенной, пока каждая `security definer` функция явно не проверяет `can_access_cohort(p_cohort_id)` или `is_admin_or_expert()`.

### Обновить RPC

- `get_my_assignment_submissions(p_cohort_id text)`
- `submit_student_assignment(p_cohort_id text, ...)`
- `get_my_notifications(p_cohort_id text)`
- `get_assignment_submissions_feed(p_cohort_id text)`
- `get_leaderboard(p_cohort_id text)`
- `get_students_for_voting(p_cohort_id text)`
- `get_my_project_votes(p_cohort_id text)`
- `submit_project_votes(p_cohort_id text, votes jsonb)`
- `get_project_votes_results(p_cohort_id text)`
- `get_final_course_ratings(p_cohort_id text)`
- `increment_points(p_user_id uuid, p_points int, p_cohort_id text)`
- `submit_expert_feedback(p_cohort_id text, ...)`
- `review_assignment_submission(p_cohort_id text, ...)`
- `get_available_cohorts()`
- `get_cohort_lesson_schedule(p_cohort_id text)`
- `get_cohort_assignment_schedule(p_cohort_id text)`
- badge/points triggers должны писать баллы в правильный `cohort_id`.

Рекомендация по именам аргументов: использовать `p_cohort_id`, а не `cohort_id`, чтобы избежать неоднозначности в SQL между именем параметра и именем колонки.

### Важные проверки внутри RPC

Каждая функция, которая принимает `cohort_id`, должна в начале делать:

```sql
if not can_access_cohort(p_cohort_id) then
  raise exception 'Forbidden';
end if;
```

Для админских функций:

```sql
if not is_admin_or_expert() then
  raise exception 'Forbidden';
end if;
```

И дальше обязательно фильтровать:

```sql
where s.cohort_id = p_cohort_id
```

### RLS-политики

Нужно добавить или обновить RLS не только для новых таблиц, но и для существующих персональных таблиц. Минимальная логика:

- `cohorts`: пользователь видит только потоки из `get_available_cohorts()`; admin/expert видит все активные потоки.
- `cohort_members`: студент видит только свои membership-строки; admin/expert видит все.
- `cohort_lesson_settings`, `cohort_material_settings`, `cohort_lesson_schedule`, `cohort_assignment_schedule`: read только если `can_access_cohort(cohort_id)`, write только admin/expert.
- `student_progress`, `assignment_submissions`, `gamification`, `agent_launches`, `platform_visits`, `peer_reviews`, `project_votes`, `user_notifications`: read/write только для своего пользователя и доступного `cohort_id`; admin/expert read для админских сценариев через RPC.
- `materials`: текущая policy `authenticated read materials using (true)` слишком широкая для потока 2. Для материалов лучше читать через RPC/view, которая учитывает `cohort_material_settings`, или заменить policy на проверку видимости по активному потоку.

Для RPC после изменения сигнатур нужно явно выдать права:

```sql
grant execute on function get_available_cohorts() to authenticated;
grant execute on function get_my_assignment_submissions(text) to authenticated;
grant execute on function submit_student_assignment(text, int, text, text, text, text) to authenticated;
```

Финальный список `grant execute` зависит от точных сигнатур после schema audit.

### Совместимость RPC при деплое

Чтобы не сломать текущий поток 1 во время выката:

- на первом шаге можно делать новые RPC с `p_cohort_id text default 'flow-1'`;
- frontend после обновления должен всегда передавать `activeCohortId`;
- после проверки можно удалить старые overload-функции без `cohort_id`, чтобы клиенты случайно не обходили потоковую фильтрацию;
- старые `security definer` функции без проверки потока должны быть удалены или превращены в wrappers для `flow-1` только на переходный период.

## Миграция существующих данных

Порядок безопасной миграции:

0. Сделать backup/export production-схемы и выполнить schema audit из блока выше.
1. Создать `cohorts`.
2. Создать `cohort_members`.
3. Добавить `cohort_id default 'flow-1'` во все персональные таблицы.
4. Проставить всем существующим строкам `cohort_id = 'flow-1'`.
5. Добавить всех текущих пользователей в `cohort_members` как участников `flow-1`.
6. Добавить администраторов и экспертов в `cohort_members` для `flow-2`.
7. Создать пустые `gamification`-строки для пользователей, которым нужен тестовый доступ в `flow-2`, с `points = 0`, `level = 1`, пустыми badges/quests.
8. Пересоздать unique constraints с учетом `cohort_id`.
9. Добавить потоковые настройки расписания для `flow-1`.
10. Для `flow-2` оставить расписание пустым или unreleased до продуктового решения по датам.
11. Добавить backward-compatible RPC с `p_cohort_id default 'flow-1'`.
12. Обновить triggers так, чтобы они брали `NEW.cohort_id` и писали баллы/бейджи в тот же поток.
13. Добавить RLS-политики и grants.
14. Обновить frontend на передачу `activeCohortId`.
15. После проверки удалить или закрыть старые RPC без `cohort_id`.
16. Проверить, что `flow-1` показывает старые данные без изменений.
17. Проверить, что `flow-2` для админа открывается, но без старых баллов, прогресса, дат потока 1 и записей.
18. Проверить, что обычный студент потока 1 не видит `flow-2` и не может получить данные `flow-2` прямым запросом.

## Frontend-план

### 1. Ввести общий контекст потока

Создать `CohortProvider` и hook `useCohort()`.

Он должен хранить:

- список доступных потоков пользователя;
- текущий `activeCohortId`;
- функцию переключения потока.

Источник состояния:

- `localStorage` для запоминания выбора;
- fallback на первый доступный поток;
- для админа можно разрешить `?cohort=flow-2`.

Доступные потоки лучше получать через RPC `get_available_cohorts()`, а не прямым запросом из React. Это оставит одну точку истины для ролей, membership и `is_visible_to_students`.

### 2. Добавить переключатель в `TopBar`

Файл: `src/components/layout/TopBar.tsx`.

Поведение:

- если доступен только один поток, показывать только текущий поток без активного выбора или не показывать переключатель;
- если доступно два потока, показать segmented control `Поток 1 / Поток 2`;
- при смене потока обновлять `activeCohortId` и перезагружать данные страниц.

### 3. Подключить `CohortProvider` в dashboard layout

Файл: `src/app/(dashboard)/layout.tsx`.

Важно: `recordVisit()` тоже должен принимать `cohort_id`, иначе посещения потоков смешаются.

### 4. Обновить data hooks

Файлы:

- `src/lib/hooks/useStudentData.ts`
- `src/lib/hooks/useContentUrls.ts`
- `src/lib/hooks/useProjectVotes.ts`
- `src/lib/hooks/useSkillData.ts`
- `src/lib/actions/recordVisit.ts`
- `src/lib/actions/recordLaunch.ts`
- `src/components/peer-review/Leaderboard.tsx`
- `src/app/(auth)/register/page.tsx`

Изменения:

- все запросы должны принимать `activeCohortId`;
- `student_progress`, `assignment_submissions`, `gamification`, `platform_visits`, `agent_launches` фильтровать по `cohort_id`;
- `useLessonUrls()` должен читать `cohort_lesson_settings`;
- `useMaterials()` должен читать только материалы, видимые в активном потоке.
- `useSkillData()` должен считать навыки только по прогрессу и ДЗ активного потока.
- `recordVisit()` и `recordLaunch()` должны записывать `cohort_id` и использовать потоковый расчет недели.
- `Leaderboard` должен вызывать `get_leaderboard(activeCohortId)`.
- регистрация должна создавать membership и `gamification` в правильном стартовом потоке, а не глобальную строку без `cohort_id`.

### 5. Обновить страницы

Страницы, которые должны учитывать `activeCohortId`:

- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/program/page.tsx`
- `src/app/(dashboard)/materials/page.tsx`
- `src/app/(dashboard)/assignments/page.tsx`
- `src/app/(dashboard)/progress/page.tsx`
- `src/app/(dashboard)/peer-review/page.tsx`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/admin/projects/page.tsx`
- `src/app/(dashboard)/admin/final-ratings/page.tsx`

### 6. Поведение потока 2 на старте

Для `flow-2`:

- главная страница показывает пустой прогресс и 0 баллов;
- если расписание еще не задано, главная страница не показывает даты и дедлайны потока 1, а отображает нейтральное состояние "Расписание скоро появится";
- программа показывает структуру курса без старых дат или с пустыми датами до заполнения `cohort_lesson_schedule`;
- записи встреч не отображаются;
- каталог материалов пустой или показывает только явно открытые материалы;
- задания могут быть видны как структура курса, но без старых сдач;
- leaderboard пустой;
- project voting пустой;
- финальный рейтинг пустой;
- админская очередь сдач пустая.

## Риски и решения

### Риск 1: данные смешаются между потоками

Решение: `cohort_id` должен быть в каждой персональной таблице и в каждом RPC.

### Риск 2: студент потока 1 откроет поток 2 прямым URL

Решение: проверка `can_access_cohort()` в Supabase и скрытие потока на фронте.

### Риск 3: старые баллы появятся в потоке 2

Решение: unique `(cohort_id, user_id)` в `gamification`; все начисления баллов должны идти с `cohort_id`.

### Риск 4: старые записи встреч появятся в потоке 2

Решение: хранить ссылки на записи не в общей `lessons.video_url`, а в `cohort_lesson_settings.video_url`.

### Риск 5: текущий поток 1 сломается после миграции

Решение: сначала проставить всем существующим данным `flow-1`, затем менять frontend/RPC. Проверять поток 1 до включения потока 2 в UI.

### Риск 6: поток 2 унаследует старое расписание потока 1

Решение: вынести расписание и дедлайны в потоковые настройки. Пока дат потока 2 нет, показывать empty-state без дат, не использовать `BOOTCAMP_START`, `LESSONS_SCHEDULE` и `DEADLINES_SCHEDULE` потока 1 как fallback для `flow-2`.

### Риск 7: миграция написана под схему, которой нет в production

Решение: использовать MCP-аудит `supabase/full_schema_audit_mcp_2026-08-03.md` как источник фактической production-схемы. Миграция должна быть идемпотентной и учитывать реальные типы `materials.id integer`, `materials.lesson_id integer`, `student_progress.lesson_id uuid`, `assignment_submissions.assignment_id integer`.

### Риск 8: старые `security definer` RPC обходят новую защиту

Решение: все функции без `p_cohort_id` либо временно сделать wrappers на `flow-1`, либо удалить после frontend-деплоя. Новые функции обязаны делать `can_access_cohort(p_cohort_id)` внутри самой функции. Отдельно закрыть или заменить `submit_expert_feedback`, потому что production-версия меняет сдачи/баллы без role-check.

### Риск 9: прямое чтение `materials` покажет скрытые материалы потока 2

Решение: не полагаться на текущую policy `authenticated read materials`. Для UI материалов читать через RPC/view, где `materials` соединяется с `cohort_material_settings` и фильтруется по `is_visible`.

## Этапы реализации

### Этап 0. Schema audit и подготовка

- Статус: завершен полностью.
- Зафиксировано: фактическая production-схема таблиц, constraints, indexes, RLS policies, grants, triggers и RPC выгружена через Supabase MCP в `supabase/full_schema_audit_mcp_2026-08-03.md`.
- Зафиксировано: completion-gate и handoff в `supabase/stage_0_completion_2026-08-03.md`.
- Зафиксировано: `materials.id integer`, `materials.lesson_id integer`, `student_progress.lesson_id uuid`, `assignment_submissions.assignment_id integer`.
- Зафиксировано: production-определение `review_assignment_submission` существует в Supabase, но отсутствует в tracked SQL.
- Зафиксировано: `auth.users` содержит 16 users, `public.users` содержит 13 profiles; backfill `cohort_members` должен идти от `auth.users`, не только от `public.users`.
- Решение по source of truth: новая миграция `supabase/migrations/008_cohorts.sql` должна быть единственным Stage 1 SQL-источником для cohort foundation; актуализация RPC/triggers идет отдельным Stage 2 migration pass.
- Решение по rollback/preflight: до применения DDL сохранить schema backup или Supabase branch snapshot, зафиксировать список функций/grants/constraints, проверить миграцию на safe database/transaction preview, не делать destructive cleanup без отдельного подтверждения.

### Этап 1. Supabase foundation

- Статус: применен в Supabase production через MCP.
- Migration: `20260803100948 008_cohorts`.
- Local file: `supabase/migrations/008_cohorts.sql`.
- Apply report: `supabase/stage_1_apply_2026-08-03.md`.
- Созданы `cohorts` и `cohort_members`.
- Созданы `cohort_lesson_settings`, `cohort_material_settings`, `cohort_lesson_schedule`, `cohort_assignment_schedule`.
- Добавлен `cohort_id` в персональные таблицы.
- Существующие данные заполнены как `flow-1`.
- Текущие пользователи добавлены в `flow-1`.
- Админы/эксперты добавлены в `flow-2`.
- Добавлены cohort-aware indexes и unique indexes.
- Старые unique constraints `(user_id, ...)` не удалены после Stage 2, потому что frontend все еще использует старые direct `on conflict` targets.
- Post-apply advisors: legacy security debt ожидаемо остается отдельным cleanup-потоком; Stage 2 уже заменил новые `admin_all` policies на insert/update/delete admin policies.

### Этап 2. Supabase access layer

- Статус: применен в Supabase production через MCP.
- Migrations: `20260803105644 009_cohort_rpc_security`, `20260803105805 010_assignment_notification_acl`.
- Apply report: `supabase/stage_2_apply_2026-08-03.md`.
- Добавлены/обновлены `is_admin_or_expert()`, `can_access_cohort(p_cohort_id)`, `assert_can_access_cohort(p_cohort_id)`, `assert_admin_or_expert()`.
- Добавлены cohort-aware RPC overloads с `p_cohort_id` и flow-1 wrappers для текущего frontend.
- Добавлены RLS policies для персональных таблиц и materials visibility через `cohort_material_settings`.
- Обновлены triggers начисления баллов/бейджей на `NEW.cohort_id`.
- Leaderboard и project voting переписаны без hardcoded email allowlist.
- Anonymous RPC execute закрыт для покрытых RPC.
- Старые unique constraints пока не удаляются: frontend еще использует старые direct `onConflict` targets для `student_progress` и `platform_visits`.
- Для cohort-aware сдачи ДЗ сохранено уведомление через follow-up migration `010_assignment_notification_acl.sql`.
- Post-apply smoke-test текущего `flow-1` обязателен до включения Stage 3 frontend context.

### Этап 3. Content settings

- Добавить `cohort_lesson_settings`.
- Добавить `cohort_material_settings`.
- Добавить `cohort_lesson_schedule`.
- Добавить `cohort_assignment_schedule`.
- Перенести текущие ссылки записей в настройки `flow-1`.
- Для `flow-2` оставить записи пустыми.
- Для `flow-2` оставить материалы скрытыми или открыть выбранные.
- Для `flow-1` перенести текущие даты уроков и дедлайны.
- Для `flow-2` оставить расписание незаполненным до появления дат.

### Этап 4. Frontend context

- Статус: завершен локально 2026-08-03.
- Создан `CohortProvider` и `useCohort()` в `src/lib/cohort/CohortProvider.tsx`.
- Provider подключен в dashboard layout и загружает потоки через `get_available_cohorts()`.
- Выбор хранится в versioned key `lms.activeCohortId.v1` и валидируется по доступному списку.
- Недоступный `?cohort=...` сбрасывается на первый доступный поток и удаляется из URL.

### Этап 5. UI-переключатель

- Статус: завершен локально 2026-08-03.
- `TopBar` получил native select с иконкой, loading skeleton, error/retry state и доступным label.
- Поток 2 не появляется у обычных студентов: он приходит только из RPC для admin/expert при текущей серверной политике.
- Страницы используют `activeCohortId` в cohort-aware queries/RPC после завершения Этапа 6.

### Этап 6. Подключение страниц

- Статус: завершен локально 2026-08-03.
- Отчет: `supabase/stage_4_frontend_integration_2026-08-03.md`.
- Обновлены главная страница, программа, материалы, задания, прогресс, skills, peer-review, project voting и админские страницы.
- `recordVisit` и `recordLaunch` записывают активный `cohort_id`.
- Расчет `week_number` для посещений и запусков использует `cohorts.starts_at`; dashboard/progress не показывают day/week flow 1 для потока без даты старта.
- Регистрация новых пользователей переведена на server-side bootstrap через `011_registration_cohort_bootstrap`.
- Прогресс использует маппинг числового `lesson_number` на UUID `lessons.id`.
- Расписание flow 2 не наследуется из flow 1; записи и материалы читаются через cohort settings.

### Этап 7. Проверка

- Статус: backend/RLS и automated checks завершены 2026-08-03; manual authenticated browser QA остается открытым.
- Отчет: `supabase/stage_5_qa_2026-08-03.md`.
- Найденный security-риск с прямым `increment_points` закрыт миграцией `012_guard_agent_launch_points`; запуск агента переведен на guarded RPC с фиксированным начислением.

- Студент потока 1 видит только поток 1.
- Админ видит поток 1 и поток 2.
- Поток 1 показывает старые данные.
- Поток 2 показывает 0 баллов и пустой прогресс.
- Поток 2 без заданного расписания не показывает даты уроков и дедлайны потока 1.
- После добавления расписания потока 2 UI показывает именно даты `flow-2`.
- В потоке 2 нет ссылок на записи.
- В потоке 2 нет старых сдач ДЗ.
- В потоке 2 нет старых голосований и рейтингов.
- Прямой запрос студента потока 1 к данным `flow-2` возвращает ошибку доступа.
- Прямой RPC-вызов старой функции без `cohort_id` невозможен или возвращает только `flow-1` на переходный период.
- Прямой select из `materials` не возвращает скрытые материалы потока 2.
- Бейджи, баллы за уроки, проверка ДЗ и запуски агентов начисляются в активный поток, а не глобально.
- Регистрация нового пользователя создает membership и `gamification` в правильном стартовом потоке.
- SQL smoke-тесты покрывают роли `student`, `expert`, `admin`.
- Сборка приложения проходит без ошибок.

## Рекомендуемый следующий шаг

Перед реализацией нужно уточнить два продуктовых решения.

### 1. Расписание потока 2

Пока расписания нет, технически безопасный режим:

- создать поток 2 доступным только admin/expert;
- не наследовать даты потока 1;
- показывать empty-state "Расписание скоро появится";
- заполнить `cohort_lesson_schedule` и `cohort_assignment_schedule`, когда даты появятся.

### 2. Материалы потока 2

Нужно выбрать продуктовый режим для материалов:

1. Скрываем вообще все материалы до открытия потока.
2. Показываем структуру уроков и ДЗ, но без записей и дополнительных материалов.
3. Показываем часть материалов, которую админ явно откроет через настройки.

Технически лучший вариант — третий: он дает гибкость и не требует нового деплоя при открытии материалов.
## Update after manual QA - 2026-08-04

- Student flow-1 and admin/expert flow were checked manually; switcher and material fixes were applied.
- Final flow-2 material rule: copy all flow-1 materials except rows whose `materials.description` starts with `Запись урока`.
- Migrations `013_flow2_material_visibility`, `014_flow2_material_visibility_by_title`, and `015_flow2_material_visibility_by_description` are applied.
- Current flow-2 material state: 36 visible materials with URLs and 12 hidden lesson recordings.
- Flow-2 schedule dates are deferred. Until dates are supplied, the UI must keep neutral schedule/deadline states and must not reuse flow-1 dates.
- Manual authenticated QA is closed; the next product step is to populate flow-2 dates and run a focused schedule regression check.
