# Full Supabase MCP Schema Audit - 2026-08-03

Source: Supabase MCP for project `psjfokjdghhcxfqzrxpw`.

Scope:

- `list_tables(verbose=true)` for `public`;
- `list_migrations`;
- `list_extensions`;
- `list_edge_functions`;
- SQL metadata queries for constraints, indexes, RLS policies, triggers, functions, grants;
- security and performance advisors;
- Postgres/API logs review for recent schema/API issues.

No destructive operations were run. No student rows, emails, URLs, keys, or private submission data are stored in this file. Function bodies were inspected through MCP with email redaction; this audit stores behavior and migration-relevant findings rather than raw personal data.

## Executive Summary

- Production database has no Supabase migration history table entries: `list_migrations` returned an empty list and logs include `relation "supabase_migrations.schema_migrations" does not exist`.
- Cohort feature tables do not exist yet: `cohorts`, `cohort_members`, `cohort_lesson_settings`, `cohort_material_settings`, `cohort_lesson_schedule`, `cohort_assignment_schedule`.
- `cohort_id` does not exist in any target personal table.
- Current data is small, but real production data exists:
  - `public.users`: 13 rows;
  - `auth.users`: 16 rows;
  - `auth.users` without `public.users` profile: 3;
  - admin/expert users in `auth.users`: 2;
  - `lessons`: 12;
  - `materials`: 48;
  - `material_urls`: 32;
  - `student_progress`: 74;
  - `assignment_submissions`: 19;
  - `user_notifications`: 38;
  - `project_votes`: 57.
- `materials` is not the same as `001_initial.sql`: production uses integer `materials.id` and integer `materials.lesson_id`, with fields `lesson_topic`, `url`, `description`, `markdown_content`.
- `lessons.id` is `uuid`, and `student_progress.lesson_id` is `uuid` FK to `lessons.id`. This conflicts with frontend code that treats lesson ids as numbers.
- `assignment_submissions.assignment_id` is `integer`, has no FK to `assignments.id`, and effectively means `hw_number`.
- `assignments` has 0 rows, while assignment UI is hardcoded in frontend. RPC uses `assignment_submissions.assignment_id` directly.
- RLS is enabled on all public tables, but several tables have no policies.
- Many `SECURITY DEFINER` functions are executable by `anon` and `authenticated`; advisors flag this as a security warning.
- Several functions have mutable `search_path`; advisors flag this as a security warning.
- Edge Functions: none.
- Installed extensions relevant to the app: `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `plpgsql`.

## Public Tables

### `users`

- Rows: 13
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `email text unique not null`
  - `name text`
  - `avatar_url text`
  - `created_at timestamptz default now()`
  - `goal text`
- Constraints:
  - `users_pkey`: primary key `(id)`
  - `users_email_key`: unique `(email)`
- RLS policies: none
- Advisor: RLS enabled but no policy.

### `lessons`

- Rows: 12
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `week int`
  - `lesson_number int`
  - `title text`
  - `topic text`
  - `has_homework boolean default false`
  - `video_url text`
  - `lesson_date date`
- Constraints:
  - `lessons_pkey`: primary key `(id)`
- RLS policy:
  - `Authenticated users see lessons`: `SELECT`, role `{public}`, `auth.role() = 'authenticated'`
- Migration concern:
  - Recording URL currently lives in shared `lessons.video_url`; for flow-2 it must move to `cohort_lesson_settings.video_url`.

### `assignments`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `lesson_id uuid references lessons(id)`
  - `title text`
  - `description text`
  - `checklist jsonb default '{}'`
  - `rubric jsonb default '{}'`
  - `deadline timestamptz`
  - `hw_number int`
- Constraints:
  - `assignments_pkey`: primary key `(id)`
  - `assignments_lesson_id_fkey`: FK `lesson_id -> lessons(id) on delete cascade`
- RLS policy:
  - `Authenticated users see assignments`: `SELECT`, role `{public}`, `auth.role() = 'authenticated'`
- Advisor:
  - `assignments_lesson_id_fkey` is unindexed.
- Migration concern:
  - Because table is empty and UI uses hardcoded assignment definitions, `cohort_assignment_schedule` should be keyed by `hw_number`, not assignment uuid, unless assignments are normalized first.

### `student_progress`

- Rows: 74
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references users(id)`
  - `lesson_id uuid references lessons(id)`
  - `status text default 'not_started'`, check `not_started|watching|completed`
  - `completed_at timestamptz`
- Constraints:
  - `student_progress_pkey`: primary key `(id)`
  - `student_progress_user_id_fkey`: FK `user_id -> users(id) on delete cascade`
  - `student_progress_lesson_id_fkey`: FK `lesson_id -> lessons(id) on delete cascade`
  - `student_progress_user_id_lesson_id_key`: unique `(user_id, lesson_id)`
- Indexes:
  - primary key index;
  - unique index on `(user_id, lesson_id)`;
  - no separate index on `lesson_id`.
- RLS policy:
  - `Users see own progress`: `ALL`, role `{public}`, `auth.uid() = user_id`
- Triggers:
  - `badge_on_progress` after insert/update -> `trigger_badge_on_progress()`
- Advisors:
  - `student_progress_lesson_id_fkey` is unindexed.
  - RLS policy re-evaluates `auth.uid()` per row; use `(select auth.uid())` in future policy.
- Cohort migration:
  - Add `cohort_id`.
  - Replace unique `(user_id, lesson_id)` with `(cohort_id, user_id, lesson_id)`.
  - Update trigger to award points/badges in `NEW.cohort_id`.
  - Frontend must stop upserting numeric lesson ids into this uuid column; resolve by `lesson_number -> lessons.id` mapping.

### `assignment_submissions`

- Rows: 19
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references auth.users(id)`
  - `assignment_id int`
  - `github_url text`
  - `video_url text`
  - `status text default 'not_started'`, check `not_started|in_progress|submitted|reviewed`
  - `submitted_at timestamptz`
  - `live_url text`
  - `artifact text`
  - `feedback text`
  - `points_earned int`
- Constraints:
  - `assignment_submissions_pkey`: primary key `(id)`
  - `assignment_submissions_user_id_fkey`: FK `user_id -> auth.users(id) on delete cascade`
  - `assignment_submissions_user_id_assignment_id_key`: unique `(user_id, assignment_id)`
  - status check
- Indexes:
  - primary key index;
  - unique index `(user_id, assignment_id)`.
- RLS policy:
  - `Users see own submissions`: `ALL`, role `{public}`, `auth.uid() = user_id`
- Triggers:
  - `badge_on_submission` after insert/update -> `trigger_badge_on_submission()`
- Advisors:
  - RLS policy re-evaluates `auth.uid()` per row.
- Cohort migration:
  - Add `cohort_id`.
  - Replace unique `(user_id, assignment_id)` with `(cohort_id, user_id, assignment_id)`.
  - Treat `assignment_id` as `hw_number` unless assignment normalization is done first.
  - Update submission/review RPC and trigger to use `p_cohort_id` / `NEW.cohort_id`.

### `gamification`

- Rows: 13
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references users(id) unique`
  - `points int default 0`
  - `level int default 1`
  - `badges jsonb default '[]'`
  - `quests jsonb default '[]'`
- Constraints:
  - `gamification_pkey`: primary key `(id)`
  - `gamification_user_id_fkey`: FK `user_id -> users(id) on delete cascade`
  - `gamification_user_id_key`: unique `(user_id)`
- RLS policy:
  - `Users see own gamification`: `ALL`, role `{public}`, `auth.uid() = user_id`
- Advisors:
  - RLS policy re-evaluates `auth.uid()` per row.
- Cohort migration:
  - Add `cohort_id`.
  - Replace unique `(user_id)` with `(cohort_id, user_id)`.
  - `increment_points` and `award_badge` must become cohort-aware and should not be directly executable by clients.

### `agent_launches`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references users(id)`
  - `launched_at timestamptz default now()`
  - `week_number int`
- Constraints:
  - `agent_launches_pkey`: primary key `(id)`
  - `agent_launches_user_id_fkey`: FK `user_id -> users(id) on delete cascade`
- RLS policy:
  - `Users see own launches`: `ALL`, role `{public}`, `auth.uid() = user_id`
- Triggers:
  - `badge_on_launch` after insert -> `trigger_badge_on_launch()`
- Advisors:
  - `agent_launches_user_id_fkey` is unindexed.
  - RLS policy re-evaluates `auth.uid()` per row.
- Cohort migration:
  - Add `cohort_id`.
  - Index `(cohort_id, user_id, week_number)`.
  - Recalculate `week_number` from cohort schedule, not global `BOOTCAMP_START`.

### `platform_visits`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references users(id)`
  - `visit_date date default current_date`
  - `week_number int`
  - `created_at timestamptz default now()`
- Constraints:
  - `platform_visits_pkey`: primary key `(id)`
  - `platform_visits_user_id_fkey`: FK `user_id -> users(id) on delete cascade`
  - `platform_visits_user_id_visit_date_key`: unique `(user_id, visit_date)`
- Indexes:
  - `idx_platform_visits_user` on `(user_id)`
  - unique `(user_id, visit_date)`
- RLS policies: none
- Advisors:
  - RLS enabled but no policies.
  - `idx_platform_visits_user` unused.
- Logs:
  - Recent inserts failed with `new row violates row-level security policy for table "platform_visits"`.
- Cohort migration:
  - Add `cohort_id`.
  - Replace unique `(user_id, visit_date)` with `(cohort_id, user_id, visit_date)`.
  - Add write policy or move writes to a guarded RPC.

### `peer_reviews`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `reviewer_id uuid references users(id)`
  - `submission_id uuid references assignment_submissions(id)`
  - `checklist_scores jsonb default '{}'`
  - `comment text`
  - `created_at timestamptz default now()`
- Constraints:
  - `peer_reviews_pkey`: primary key `(id)`
  - `peer_reviews_reviewer_id_fkey`: FK `reviewer_id -> users(id) on delete cascade`
  - `peer_reviews_submission_id_fkey`: FK `submission_id -> assignment_submissions(id) on delete cascade`
- RLS policy:
  - `Users see own reviews`: `ALL`, role `{public}`, `auth.uid() = reviewer_id`
- Triggers:
  - `badge_on_peer_review` after insert -> `trigger_badge_on_peer_review()`
- Advisors:
  - both peer review FKs are unindexed.
  - RLS policy re-evaluates `auth.uid()` per row.
- Cohort migration:
  - Add `cohort_id` or infer via submission. Prefer explicit `cohort_id` for trigger simplicity and auditability.
  - Badge count must be scoped by `(cohort_id, reviewer_id)`.

### `project_votes`

- Rows: 57
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `voter_id uuid references users(id)`
  - `votee_id uuid references users(id)`
  - `score int check 0..10`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
- Constraints:
  - `project_votes_pkey`: primary key `(id)`
  - `project_votes_voter_id_fkey`: FK `voter_id -> users(id) on delete cascade`
  - `project_votes_votee_id_fkey`: FK `votee_id -> users(id) on delete cascade`
  - `project_votes_voter_id_votee_id_key`: unique `(voter_id, votee_id)`
  - score check
- Indexes:
  - `idx_project_votes_voter`
  - `idx_project_votes_votee`
  - unique `(voter_id, votee_id)`
- RLS policies: none
- Advisors:
  - RLS enabled but no policies.
  - `idx_project_votes_votee` unused.
- Cohort migration:
  - Add `cohort_id`.
  - Replace unique `(voter_id, votee_id)` with `(cohort_id, voter_id, votee_id)`.
  - All voting/results/final ratings RPC must become admin/role/cohort-aware.

### `user_notifications`

- Rows: 38
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id uuid default gen_random_uuid()`
  - `user_id uuid references auth.users(id)`
  - `title text`
  - `body text`
  - `kind text default 'info'`
  - `metadata jsonb default '{}'`
  - `created_at timestamptz default now()`
- Constraints:
  - `user_notifications_pkey`: primary key `(id)`
  - `user_notifications_user_id_fkey`: FK `user_id -> auth.users(id) on delete cascade`
- Indexes:
  - `idx_user_notifications_user_created_at` on `(user_id, created_at desc)`
- RLS policies: none
- Advisors:
  - RLS enabled but no policies.
- Cohort migration:
  - Add `cohort_id`.
  - `get_my_notifications(p_cohort_id)` must filter by `cohort_id`.

### `materials`

- Rows: 48
- RLS: enabled
- Primary key: `id`
- Columns:
  - `id int`
  - `title text`
  - `type text check video|template|technique`
  - `week int`
  - `lesson_id int`
  - `lesson_topic text`
  - `url text default ''`
  - `description text`
  - `markdown_content text`
- Constraints:
  - `materials_pkey`: primary key `(id)`
  - `materials_type_check`
- RLS policy:
  - `authenticated read materials`: `SELECT`, role `{authenticated}`, `true`
- Cohort migration:
  - Use `cohort_material_settings.material_id int references materials(id)`.
  - Current broad read policy would expose all materials to authenticated users unless frontend reads via guarded RPC/view.
  - `material_urls` also exists and must be accounted for.

### `material_urls`

- Rows: 32
- RLS: enabled
- Primary key: `material_id`
- Columns:
  - `material_id int`
  - `url text default ''`
- RLS policy:
  - `authenticated read material_urls`: `SELECT`, role `{authenticated}`, `true`
- Cohort migration:
  - Decide whether this table is legacy, current source of truth, or should be folded into `cohort_material_settings`.

## RLS Policies

Existing policies:

- `agent_launches`: `Users see own launches`, `ALL`, `{public}`, `auth.uid() = user_id`
- `assignment_submissions`: `Users see own submissions`, `ALL`, `{public}`, `auth.uid() = user_id`
- `assignments`: `Authenticated users see assignments`, `SELECT`, `{public}`, `auth.role() = 'authenticated'`
- `gamification`: `Users see own gamification`, `ALL`, `{public}`, `auth.uid() = user_id`
- `lessons`: `Authenticated users see lessons`, `SELECT`, `{public}`, `auth.role() = 'authenticated'`
- `material_urls`: `authenticated read material_urls`, `SELECT`, `{authenticated}`, `true`
- `materials`: `authenticated read materials`, `SELECT`, `{authenticated}`, `true`
- `peer_reviews`: `Users see own reviews`, `ALL`, `{public}`, `auth.uid() = reviewer_id`
- `student_progress`: `Users see own progress`, `ALL`, `{public}`, `auth.uid() = user_id`

Tables with RLS enabled but no policies:

- `users`
- `platform_visits`
- `project_votes`
- `user_notifications`

RLS migration notes:

- Replace per-row `auth.uid()`/`auth.role()` calls with `(select auth.uid())` / `(select auth.role())` in new policies.
- Add cohort checks to every personal table policy.
- Do not rely only on frontend filtering; `SECURITY DEFINER` RPC can bypass RLS.

## Function/RPC Audit

All listed public functions are `SECURITY DEFINER`.

Functions with mutable `search_path` according to advisors:

- `award_badge`
- `increment_points`
- `submit_expert_feedback`
- `submit_project_votes`
- `get_my_project_votes`
- `get_project_votes_results`
- `get_students_for_voting`
- `get_final_course_ratings`
- `trigger_badge_on_progress`
- `trigger_badge_on_submission`
- `trigger_badge_on_launch`
- `trigger_badge_on_peer_review`

Functions with `search_path` already set:

- `get_assignment_submissions_feed`: `search_path=public, auth`
- `get_my_assignment_submissions`: `search_path=public, auth`
- `get_my_notifications`: `search_path=public, auth`
- `get_leaderboard`: `search_path=public`
- `review_assignment_submission`: `search_path=public, auth`
- `submit_student_assignment`: `search_path=public, auth`

### Public RPC and security behavior

- `award_badge(p_user_id uuid, p_badge_id int)`
  - Directly mutates `gamification.badges` and calls `increment_points`.
  - No role/auth/cohort checks.
  - Must be revoked from `anon`/`authenticated` or moved out of exposed API.

- `increment_points(p_user_id uuid, p_points int)`
  - Inserts/upserts `gamification` by `user_id`.
  - No role/auth/cohort checks.
  - Must become `increment_points(p_user_id, p_points, p_cohort_id)` and be protected from direct client execution.

- `submit_student_assignment(...)`
  - Checks `auth.uid()`.
  - Upserts `(user_id, assignment_id)`.
  - Creates `user_notifications`.
  - Needs `p_cohort_id`, `can_access_cohort`, upsert on `(cohort_id, user_id, assignment_id)`, and notification `cohort_id`.

- `get_my_assignment_submissions()`
  - Filters only `user_id = auth.uid()`.
  - Needs `p_cohort_id` and cohort access check.

- `get_my_notifications()`
  - Filters only `user_id = auth.uid()`.
  - Needs `p_cohort_id`.

- `get_assignment_submissions_feed()`
  - Checks `auth.users.raw_app_meta_data.role in ('admin','expert')`.
  - Returns all submitted/reviewed submissions across all users.
  - Needs `p_cohort_id` and filter.

- `review_assignment_submission(submission_id uuid, feedback_text text default null, earned_points int default null)`
  - Exists in production but not in tracked SQL.
  - Checks admin/expert role.
  - Updates submission by `id`, inserts notification.
  - Does not increment `gamification.points`; currently only `points_earned` is set.
  - Needs `p_cohort_id`, filter by submission cohort, notification cohort, and points logic decision.

- `submit_expert_feedback(student_email, hw_number, feedback_text, points_awarded)`
  - No admin/expert role check.
  - Looks up student by email in `auth.users`.
  - Updates or inserts assignment submission by `(user_id, assignment_id)`.
  - Directly updates `gamification.points`.
  - High risk. Needs role check, `p_cohort_id`, and probably removal in favor of `review_assignment_submission`.

- `get_leaderboard()`
  - SQL function with hardcoded participant email allowlist.
  - Returns aggregate points without auth/cohort filtering.
  - Needs `get_leaderboard(p_cohort_id)` based on `cohort_members`, not hardcoded emails.

- `get_students_for_voting()`
  - Returns all `public.users` except current user and organizer names.
  - No cohort filter.
  - Needs `p_cohort_id` and `cohort_members`.

- `submit_project_votes(votes jsonb)`
  - Checks `auth.uid()`.
  - Upserts `(voter_id, votee_id)`.
  - Needs `p_cohort_id`, access check, votee membership check, and unique `(cohort_id, voter_id, votee_id)`.

- `get_my_project_votes()`
  - Filters only `voter_id = auth.uid()`.
  - Needs `p_cohort_id`.

- `get_project_votes_results()`
  - No admin/expert role check.
  - Returns all project vote aggregates.
  - Needs admin/expert check and `p_cohort_id`.

- `get_final_course_ratings()`
  - No admin/expert role check.
  - Combines global `gamification` and global `project_votes`.
  - Needs admin/expert check and `p_cohort_id`.

### Trigger Functions

- `trigger_badge_on_progress`
  - Adds +10 points on first completed lesson.
  - Awards badge 1 if completed lesson is week 1 lesson 1.
  - Uses global `increment_points` and global `award_badge`.

- `trigger_badge_on_submission`
  - Awards badges by `NEW.assignment_id` values 1..6.
  - Uses global `award_badge`.

- `trigger_badge_on_launch`
  - Counts launches by `user_id` and `week_number`.
  - Awards launch badges globally.

- `trigger_badge_on_peer_review`
  - Counts reviews by `reviewer_id`.
  - Awards peer review badge globally.

Cohort migration:

- All trigger functions must use `NEW.cohort_id`.
- All badge counting queries must filter by `cohort_id`.
- Trigger functions should set fixed `search_path`.
- Trigger functions should not be callable by `anon`/`authenticated` over REST.

## Grants

Routine grants:

- Every public RPC/function listed above has `EXECUTE` for both `anon` and `authenticated`.
- Advisors flag this for `SECURITY DEFINER` functions.

Table grants:

- `anon` and `authenticated` have broad table privileges on public tables, including `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`.
- RLS is currently the main table-level guard.

Migration implication:

- Add explicit `revoke execute on function ... from anon` for internal/helper/admin RPC.
- Keep `authenticated` execute only where the function is meant to be client-callable and has internal auth/cohort checks.
- Consider narrowing table grants after RLS/RPC design is finalized.

## Advisors

Security advisors:

- RLS enabled but no policy:
  - `public.platform_visits`
  - `public.project_votes`
  - `public.user_notifications`
  - `public.users`
- Mutable function search path:
  - multiple RPC and trigger functions listed above.
- Public can execute `SECURITY DEFINER` functions:
  - flagged for all or most public RPC/functions.
- Signed-in users can execute `SECURITY DEFINER` functions:
  - flagged for all or most public RPC/functions.
- Auth leaked password protection is disabled.

Performance advisors:

- Unindexed foreign keys:
  - `agent_launches_user_id_fkey`
  - `assignments_lesson_id_fkey`
  - `peer_reviews_reviewer_id_fkey`
  - `peer_reviews_submission_id_fkey`
  - `student_progress_lesson_id_fkey`
- RLS initplan warnings:
  - policies using `auth.uid()` / `auth.role()` directly on `student_progress`, `assignment_submissions`, `agent_launches`, `gamification`, `peer_reviews`, `lessons`, `assignments`.
- Unused indexes:
  - `idx_platform_visits_user`
  - `idx_project_votes_votee`

## Logs Review

Recent Postgres/API logs show:

- Our previous probes generated expected errors for missing `cohort_id` columns and missing `materials.content_url`.
- `platform_visits` inserts failed with RLS policy violations, consistent with RLS enabled and no policy.
- `supabase_migrations.schema_migrations` does not exist, consistent with empty MCP migration list.
- REST calls confirmed some RPC endpoints returned 200 through anon/service-role probes.

## Migration Recommendations

### Before `008_cohorts.sql`

- Decide source of membership backfill:
  - `auth.users` has 16 users;
  - `public.users` has 13 profiles;
  - 3 auth users have no public profile.
- Recommended: `cohort_members` should reference `auth.users` and backfill from `auth.users`; frontend profile display can still use `public.users` or auth metadata.
- Resolve lesson id mismatch:
  - use uuid `lessons.id` in `student_progress`;
  - map numeric `lesson_number` to uuid in frontend/hooks/RPC.
- Decide whether `material_urls` is legacy or part of current material URL source.
- Decide whether `submit_expert_feedback` should be removed or replaced by `review_assignment_submission`.

### Foundation migration

- Add cohort tables and settings tables additively.
- Add `cohort_id text default 'flow-1'` to:
  - `student_progress`
  - `assignment_submissions`
  - `gamification`
  - `agent_launches`
  - `platform_visits`
  - `project_votes`
  - `peer_reviews`
  - `user_notifications`
- Add `cohort_id` to `material_urls` only if that table remains source of truth; otherwise migrate its role into `cohort_material_settings`.
- Backfill existing rows as `flow-1`.
- Add indexes:
  - `(cohort_id, user_id)` for personal tables;
  - `(cohort_id, user_id, lesson_id)` unique for progress;
  - `(cohort_id, user_id, assignment_id)` unique for submissions;
  - `(cohort_id, user_id)` unique for gamification;
  - `(cohort_id, user_id, visit_date)` unique for platform visits;
  - `(cohort_id, voter_id, votee_id)` unique for votes;
  - `(cohort_id, reviewer_id)` and `(cohort_id, submission_id)` for peer reviews;
  - `(cohort_id, week_number)` where dashboard queries need it.

### Security/RPC migration

- Add helpers:
  - `is_admin_or_expert()`
  - `can_access_cohort(p_cohort_id text)`
  - `get_available_cohorts()`
- Recreate client-facing RPC with `p_cohort_id`.
- Add explicit role/cohort checks inside every `SECURITY DEFINER` function.
- Set fixed `search_path` on every function.
- Revoke direct `EXECUTE` from `anon` for all RPC not intended to be public.
- Revoke `EXECUTE` from `authenticated` for internal helpers and trigger functions.
- Keep trigger functions executable by table owner/runtime only.

### RLS migration

- Add policies for no-policy tables.
- Replace broad material read with cohort-aware material RPC/view or policy.
- Use `(select auth.uid())` / `(select auth.role())` in new policies for performance.
- Admin/expert cross-user views should generally go through guarded RPC rather than wide table policies.

## Product Impact

- Without fixing RPC/grants, flow-2 can leak even if React hides it.
- Without fixing `student_progress.lesson_id`, program progress may remain inconsistent or fail during upserts.
- Without `cohort_assignment_schedule`, flow-2 will inherit old deadlines from hardcoded frontend state.
- Without changing `material_urls`/`materials` read model, flow-2 may expose flow-1 recordings/materials.

## Recommended Next Step

Do not apply production DDL yet. First create a local migration draft `supabase/migrations/008_cohorts.sql` that is additive and reviewable:

1. cohort tables/settings;
2. `cohort_id` columns and backfill;
3. indexes and new unique constraints, with old constraints dropped only after data is backfilled;
4. helper functions and RLS policies;
5. no destructive cleanup of old RPC until frontend is updated.

Then create a second migration for RPC/security replacement after the frontend contract is clear.
