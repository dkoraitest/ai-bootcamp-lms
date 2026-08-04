# Stage 1 Apply Report - Cohort Foundation

Date: 2026-08-03

Status: applied to Supabase production through MCP.

Applied migration:

- Version: `20260803100948`
- Name: `008_cohorts`
- Local file: `supabase/migrations/008_cohorts.sql`

No `drop table`, `truncate`, `delete from`, `drop constraint`, `drop function`, or `drop trigger` operations were used. Existing legacy RPC/functions and old unique constraints were intentionally kept for frontend compatibility until Stage 2.

## Preflight

Read-only preflight before apply confirmed:

- no cohort tables existed yet;
- no `cohort_id` columns existed on target personal tables;
- `materials.id` was `integer`;
- `materials.lesson_id` was `integer`;
- `materials.url` existed;
- `student_progress.lesson_id` was `uuid`;
- `assignment_submissions.assignment_id` was `integer`.

## Applied Foundation

Created:

- `cohorts`
- `cohort_members`
- `cohort_lesson_settings`
- `cohort_material_settings`
- `cohort_lesson_schedule`
- `cohort_assignment_schedule`

Added `cohort_id` to:

- `student_progress`
- `assignment_submissions`
- `gamification`
- `agent_launches`
- `platform_visits`
- `project_votes`
- `peer_reviews`
- `user_notifications`

Created helper functions:

- `is_admin_or_expert()`
- `can_access_cohort(p_cohort_id text)`
- `get_available_cohorts()`

Enabled RLS and added policies for the new cohort tables.

## Verification Results

Migration list:

- `20260803100948 008_cohorts`

Cohorts:

- `flow-1`: visible to students, starts at `2026-05-12`
- `flow-2`: hidden from students, no start date yet

Backfill counts:

- `cohort_members`: 18 total
- `flow-1` members: 16
- `flow-2` members: 2
- `flow-1` lesson settings: 12
- `flow-2` lesson settings: 12
- `flow-1` material settings: 48
- `flow-2` material settings: 48
- `flow-1` lesson schedule rows: 12
- `flow-2` lesson schedule rows: 12
- `flow-1` assignment schedule rows: 6
- `flow-2` assignment schedule rows: 6

Personal table backfill:

- `student_progress`: 74 total, 74 in `flow-1`, 0 null
- `assignment_submissions`: 19 total, 19 in `flow-1`, 0 null
- `gamification`: 13 total, 13 in `flow-1`, 0 null
- `project_votes`: 57 total, 57 in `flow-1`, 0 null
- `user_notifications`: 38 total, 38 in `flow-1`, 0 null
- `agent_launches`: 0 total, 0 null
- `platform_visits`: 0 total, 0 null
- `peer_reviews`: 0 total, 0 null

Security shape:

- all 6 new cohort tables have RLS enabled;
- each new cohort table has policies;
- helper functions have fixed `search_path = public, auth`;
- helper functions are executable by `authenticated`, not `anon`;
- old compatibility constraints are still present.

## Post-Apply Advisors

Expected remaining Stage 2 security debt:

- legacy tables without policies: `users`, `platform_visits`, `project_votes`, `user_notifications`;
- legacy RPC/functions still exposed as `SECURITY DEFINER`;
- legacy functions with mutable `search_path`;
- high-risk legacy `submit_expert_feedback` remains for Stage 2 remediation.

New cleanup candidate:

- Supabase performance advisor reports `multiple_permissive_policies` on new cohort tables because each table has both a select policy and an admin-all policy. This is not a data leak, but it should be cleaned up by replacing admin-all with separate insert/update/delete admin policies.

## Stage 1 Product Result

The database now has a cohort foundation:

- all existing student data remains assigned to `flow-1`;
- `flow-2` exists but is hidden from students;
- `flow-2` has no old progress, points, submissions, votes, notifications, visits, or launches;
- `flow-2` has no released schedule, recordings, or visible materials for students;
- old frontend RPC paths should continue to work as `flow-1` because defaults and old unique constraints were preserved.

## Next Step

Start Stage 2:

1. clean up new cohort-table policies to remove `multiple_permissive_policies`;
2. export/version `review_assignment_submission`;
3. replace legacy RPC with cohort-aware `p_cohort_id` versions;
4. update triggers to write points/badges into `NEW.cohort_id`;
5. revoke or guard internal/high-risk RPC such as `increment_points`, `award_badge`, and `submit_expert_feedback`.
