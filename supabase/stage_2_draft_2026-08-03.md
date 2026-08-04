# Stage 2 Draft Report - Cohort RPC and Security

Date: 2026-08-03

Status: draft was applied to Supabase production on 2026-08-03. The apply result is recorded in `supabase/stage_2_apply_2026-08-03.md`.

Migration draft:

- `supabase/migrations/009_cohort_rpc_security.sql`
- follow-up: `supabase/migrations/010_assignment_notification_acl.sql`

## Scope

The draft migration implements the Stage 2 transition layer:

- cohort-aware RPC overloads with `p_cohort_id`;
- backward-compatible flow-1 wrappers for current frontend calls;
- cohort-aware points and badge helpers;
- cohort-aware trigger functions;
- guarded admin/expert review functions;
- guarded project voting and final ratings;
- RLS policies for existing personal tables;
- materials visibility policy through `cohort_material_settings`;
- grants/revokes to remove anonymous RPC execution.

## Compatibility Decision

Old unique constraints are intentionally not dropped in this migration.

Reason: the current frontend still uses direct old conflict targets:

- `student_progress`: `onConflict: "user_id,lesson_id"`;
- `platform_visits`: `onConflict: "user_id,visit_date"`;
- direct flow-1 reads also assume one `gamification` row per user.

Dropping old constraints now could break the current UI before the CohortProvider/frontend integration is done. The migration therefore improves security and adds cohort-aware RPC, but leaves physical uniqueness cleanup for the frontend integration pass.

## Main Changes

New/updated helpers:

- `is_admin_or_expert()`
- `can_access_cohort(p_cohort_id text)`
- `assert_can_access_cohort(p_cohort_id text)`
- `assert_admin_or_expert()`
- `get_available_cohorts()`

RPC transition pattern:

- new cohort-aware signature with `p_cohort_id`;
- old signature remains as a wrapper to `flow-1`.

Covered RPC:

- `submit_student_assignment`
- `get_my_assignment_submissions`
- `get_my_notifications`
- `get_assignment_submissions_feed`
- `review_assignment_submission`
- `submit_expert_feedback`
- `get_leaderboard`
- `get_students_for_voting`
- `submit_project_votes`
- `get_my_project_votes`
- `get_project_votes_results`
- `get_final_course_ratings`
- `increment_points`
- `award_badge`

Trigger functions now use `NEW.cohort_id`:

- `trigger_badge_on_progress`
- `trigger_badge_on_submission`
- `trigger_badge_on_launch`
- `trigger_badge_on_peer_review`

## Security Effects

- `submit_expert_feedback` becomes admin/expert-only and cohort-scoped.
- `review_assignment_submission` becomes admin/expert-only and cohort-scoped.
- `get_project_votes_results` and `get_final_course_ratings` become admin/expert-only.
- `get_leaderboard` no longer uses a hardcoded email allowlist.
- anonymous `EXECUTE` is revoked for covered RPC.
- `award_badge`, trigger functions, and assertion helpers are not granted to authenticated clients.
- `increment_points` remains callable by authenticated users during transition, but guarded by user/cohort checks.

## RLS Effects

Existing personal tables get cohort-aware policies:

- `student_progress`
- `assignment_submissions`
- `gamification`
- `agent_launches`
- `platform_visits`
- `peer_reviews`
- `project_votes`
- `user_notifications`
- `users`

Materials direct reads become visible only when a material is visible in an accessible cohort.

Stage 1 `admin_all` policies on new cohort tables are split into insert/update/delete admin policies to remove `multiple_permissive_policies` on SELECT.

## Static Verification

Checked locally:

- no `drop table`;
- no `truncate`;
- no `delete from`;
- no `drop constraint`;
- no `drop function`;
- no `grant execute ... to anon`;
- no token/key/URL secrets;
- no hardcoded email allowlist in the new migration;
- dollar-quote markers are balanced.

## Apply Result

The user explicitly approved continuation. Supabase MCP applied both migrations successfully. The assignment notification block was moved to the follow-up migration after the first migration parser rejected that block; no data was deleted or rewritten.

Post-apply checks confirmed the migration versions, cohort membership counts, flow-2 empty-state invariants, RLS policy coverage, and anonymous RPC revokes. See `supabase/stage_2_apply_2026-08-03.md` for details.

## Known Remaining Work

After frontend CohortProvider integration:

- update direct `student_progress` upserts to use `cohort_id` and cohort-aware conflict target;
- update direct `platform_visits` upserts to use `cohort_id` and cohort-aware conflict target;
- make direct `gamification` reads filter by active cohort;
- then drop old unique constraints and old wrapper RPC signatures.
