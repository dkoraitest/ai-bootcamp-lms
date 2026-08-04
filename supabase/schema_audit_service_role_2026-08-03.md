# Supabase service-role schema audit - 2026-08-03

Source: PostgREST OpenAPI (`/rest/v1/`) using `SERVICE_ROLE_KEY` from `.env.local`. Secret values and user rows were not saved.

Limitation: OpenAPI exposes public tables, columns, types, PK/FK hints, and RPC signatures. It does not expose unique constraints, indexes, RLS policies, grants, or function bodies. Use Supabase SQL Editor or a database URL for the full audit.

## Summary

- Public tables: `agent_launches`, `assignment_submissions`, `assignments`, `gamification`, `lessons`, `material_urls`, `materials`, `peer_reviews`, `platform_visits`, `project_votes`, `student_progress`, `user_notifications`, `users`.
- Public RPC: `award_badge`, `get_assignment_submissions_feed`, `get_final_course_ratings`, `get_leaderboard`, `get_my_assignment_submissions`, `get_my_notifications`, `get_my_project_votes`, `get_project_votes_results`, `get_students_for_voting`, `increment_points`, `review_assignment_submission`, `submit_expert_feedback`, `submit_project_votes`, `submit_student_assignment`.
- Missing planned cohort tables in exposed public schema: `cohorts`, `cohort_members`, `cohort_lesson_settings`, `cohort_material_settings`, `cohort_lesson_schedule`, `cohort_assignment_schedule`.
- `cohort_id` is absent from every target table planned for cohort isolation.
- `materials.id` and `materials.lesson_id` are integer. `materials.content_url` does not exist.
- `lessons.id` is uuid. `student_progress.lesson_id` is uuid and has an FK hint to `lessons.id`, while the current frontend program page uses numeric lesson ids. The implementation should either store progress by lesson uuid or consistently resolve numeric `lesson_number` to uuid.
- `assignment_submissions.assignment_id` is integer and has no FK hint to `assignments.id`; it currently behaves as `hw_number`.
- `review_assignment_submission` exists remotely but is not present in tracked SQL files. Export its definition before editing assignment RPC.
- `increment_points` and `award_badge` are exposed as RPC. They should be blocked from direct client use or guarded by strict checks.

## Tables

### `agent_launches`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | nullable or defaulted | FK users.id |
| `launched_at` | timestamp with time zone | nullable or defaulted default "now()" | - |
| `week_number` | integer | not null/openapi-required | - |

### `assignment_submissions`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | nullable or defaulted | - |
| `assignment_id` | integer | nullable or defaulted | - |
| `github_url` | text | nullable or defaulted | - |
| `video_url` | text | nullable or defaulted | - |
| `status` | text | nullable or defaulted default "not_started" | - |
| `submitted_at` | timestamp with time zone | nullable or defaulted | - |
| `live_url` | text | nullable or defaulted | - |
| `artifact` | text | nullable or defaulted | - |
| `feedback` | text | nullable or defaulted | - |
| `points_earned` | integer | nullable or defaulted | - |

### `assignments`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `lesson_id` | uuid | nullable or defaulted | FK lessons.id |
| `title` | text | not null/openapi-required | - |
| `description` | text | not null/openapi-required | - |
| `checklist` | jsonb | nullable or defaulted | - |
| `rubric` | jsonb | nullable or defaulted | - |
| `deadline` | timestamp with time zone | nullable or defaulted | - |
| `hw_number` | integer | not null/openapi-required | - |

### `gamification`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | nullable or defaulted | FK users.id |
| `points` | integer | nullable or defaulted default 0 | - |
| `level` | integer | nullable or defaulted default 1 | - |
| `badges` | jsonb | nullable or defaulted | - |
| `quests` | jsonb | nullable or defaulted | - |

### `lessons`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `week` | integer | not null/openapi-required | - |
| `lesson_number` | integer | not null/openapi-required | - |
| `title` | text | not null/openapi-required | - |
| `topic` | text | not null/openapi-required | - |
| `has_homework` | boolean | nullable or defaulted default false | - |
| `video_url` | text | nullable or defaulted | - |
| `lesson_date` | date | not null/openapi-required | - |

### `material_urls`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `material_id` | integer | not null/openapi-required | PK |
| `url` | text | not null/openapi-required default "" | - |

### `materials`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | integer | not null/openapi-required | PK |
| `title` | text | not null/openapi-required | - |
| `type` | text | not null/openapi-required | - |
| `week` | integer | not null/openapi-required | - |
| `lesson_id` | integer | not null/openapi-required | - |
| `lesson_topic` | text | not null/openapi-required | - |
| `url` | text | not null/openapi-required default "" | - |
| `description` | text | nullable or defaulted | - |
| `markdown_content` | text | nullable or defaulted | - |

### `peer_reviews`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `reviewer_id` | uuid | nullable or defaulted | FK users.id |
| `submission_id` | uuid | nullable or defaulted | FK assignment_submissions.id |
| `checklist_scores` | jsonb | nullable or defaulted | - |
| `comment` | text | nullable or defaulted | - |
| `created_at` | timestamp with time zone | nullable or defaulted default "now()" | - |

### `platform_visits`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | nullable or defaulted | FK users.id |
| `visit_date` | date | not null/openapi-required default "CURRENT_DATE" | - |
| `week_number` | integer | not null/openapi-required | - |
| `created_at` | timestamp with time zone | nullable or defaulted default "now()" | - |

### `project_votes`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `voter_id` | uuid | not null/openapi-required | FK users.id |
| `votee_id` | uuid | not null/openapi-required | FK users.id |
| `score` | integer | not null/openapi-required | - |
| `created_at` | timestamp with time zone | nullable or defaulted default "now()" | - |
| `updated_at` | timestamp with time zone | nullable or defaulted default "now()" | - |

### `student_progress`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | nullable or defaulted | FK users.id |
| `lesson_id` | uuid | nullable or defaulted | FK lessons.id |
| `status` | text | nullable or defaulted default "not_started" | - |
| `completed_at` | timestamp with time zone | nullable or defaulted | - |

### `user_notifications`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `user_id` | uuid | not null/openapi-required | - |
| `title` | text | not null/openapi-required | - |
| `body` | text | not null/openapi-required | - |
| `kind` | text | nullable or defaulted default "info" | - |
| `metadata` | jsonb | nullable or defaulted | - |
| `created_at` | timestamp with time zone | nullable or defaulted default "now()" | - |

### `users`

| Column | Type | Null/default | Keys |
| --- | --- | --- | --- |
| `id` | uuid | not null/openapi-required default "gen_random_uuid()" | PK |
| `email` | text | not null/openapi-required | - |
| `name` | text | nullable or defaulted | - |
| `avatar_url` | text | nullable or defaulted | - |
| `created_at` | timestamp with time zone | nullable or defaulted default "now()" | - |
| `goal` | text | nullable or defaulted | - |

## RPC signatures

- `award_badge(p_badge_id: integer, p_user_id: uuid)`
- `get_assignment_submissions_feed()`
- `get_final_course_ratings()`
- `get_leaderboard()`
- `get_my_assignment_submissions()`
- `get_my_notifications()`
- `get_my_project_votes()`
- `get_project_votes_results()`
- `get_students_for_voting()`
- `increment_points(p_points: integer, p_user_id: uuid)`
- `review_assignment_submission(earned_points?: integer, feedback_text?: text, submission_id: uuid)`
- `submit_expert_feedback(feedback_text: text, hw_number: integer, points_awarded: integer, student_email: text)`
- `submit_project_votes(votes: jsonb)`
- `submit_student_assignment(artifact_text?: text, github_link?: text, hw_number: integer, live_link?: text, video_link?: text)`

## Still required via SQL Editor

- Unique constraints, especially for `student_progress`, `assignment_submissions`, `gamification`, `platform_visits`, `project_votes`.
- Indexes, to keep dashboard/progress/admin pages fast after adding `cohort_id`.
- RLS policies. OpenAPI does not show whether tables are protected.
- `pg_get_functiondef` for all RPC, especially `review_assignment_submission`, `increment_points`, `award_badge`, `submit_expert_feedback`, leaderboard/project ratings.
- Grants for RPC: which functions are executable by `anon` and `authenticated`.

## SQL for the full audit

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

```sql
select conname, conrelid::regclass as table_name, pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;
```

```sql
select indexname, tablename, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select routine_name, pg_get_function_arguments(p.oid) as args, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by routine_name, args;
```
