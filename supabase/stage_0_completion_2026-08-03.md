# Stage 0 Completion - Schema Audit and Preparation

Date: 2026-08-03

Status: completed.

Scope: Multi-Cohort LMS foundation planning before `008_cohorts.sql`.

No destructive Supabase operations were executed. No production DDL was applied. No secrets, email addresses, private student rows, submission text, or tokenized URLs are stored in this file.

## Audit Agent

Runtime schema-audit/prep sub-agent was created for independent Stage 0 verification:

- Agent nickname: `Confucius`
- Agent task: verify Stage 0 completeness across planning and Supabase audit artifacts.
- Allowed scope: local docs and audit files only.
- Forbidden scope: production DDL, destructive operations, secrets, private rows, raw personal data.

Reusable project role:

- Name: `schema-audit-prep`
- Purpose: validate the database contract before any cohort migration.
- Primary inputs:
  - `plans.md`
  - `AGENTS.md`
  - `supabase/full_schema_audit_mcp_2026-08-03.md`
  - `supabase/schema_audit_2026-08-03.md`
  - `supabase/schema_audit_service_role_2026-08-03.md`
- Primary output: this Stage 0 completion gate and actionable handoff to Stage 1.

## Source Artifacts

- Full MCP audit: `supabase/full_schema_audit_mcp_2026-08-03.md`
- Anon REST probe: `supabase/schema_audit_2026-08-03.md`
- Service-role OpenAPI audit: `supabase/schema_audit_service_role_2026-08-03.md`
- Implementation plan: `plans.md`
- Project agent instructions: `AGENTS.md`

## Completion Checklist

- [x] Public table inventory collected.
- [x] Exact production column types captured for migration-critical tables.
- [x] Primary keys, unique constraints, foreign keys, and indexes captured.
- [x] RLS enabled/disabled state and policies captured.
- [x] Tables with RLS enabled but no policies identified.
- [x] Routine grants and broad table grants captured.
- [x] Public RPC/functions inventory captured.
- [x] `SECURITY DEFINER` risks captured.
- [x] Trigger inventory and trigger-function risks captured.
- [x] Supabase migration history checked.
- [x] Edge Function inventory checked.
- [x] Installed extension inventory checked.
- [x] Security advisor findings captured.
- [x] Performance advisor findings captured.
- [x] Recent API/Postgres logs reviewed for schema/RLS issues.
- [x] Existing production row counts summarized without storing private rows.
- [x] `review_assignment_submission` production-only function identified.
- [x] `submit_expert_feedback` high-risk function identified.
- [x] Lesson id mismatch documented.
- [x] Assignment id / `hw_number` behavior documented.
- [x] Materials schema mismatch documented.
- [x] Membership backfill source decided.
- [x] SQL source of truth decided for Stage 1.
- [x] Rollback and preflight requirements documented.

## Verified Production Contract

Use this contract when drafting `008_cohorts.sql`:

- Cohort tables do not exist yet:
  - `cohorts`
  - `cohort_members`
  - `cohort_lesson_settings`
  - `cohort_material_settings`
  - `cohort_lesson_schedule`
  - `cohort_assignment_schedule`
- `cohort_id` is absent from all current target tables.
- `materials.id` is `integer`.
- `materials.lesson_id` is `integer`.
- `lessons.id` is `uuid`.
- `student_progress.lesson_id` is `uuid` and references `lessons.id`.
- `assignment_submissions.assignment_id` is `integer`, has no FK to `assignments.id`, and behaves as `hw_number`.
- `assignments` currently has 0 rows.
- `auth.users` has 16 rows.
- `public.users` has 13 rows.
- 3 auth users have no public profile.
- Public schema has 13 tables, all with RLS enabled.
- 4 RLS-enabled public tables have no policies.
- Public schema has 18 public functions.
- All 18 public functions are `SECURITY DEFINER`.
- 12 public functions have no function config/search path.
- No Edge Functions are deployed.
- Supabase migration history is empty or unavailable in production.

Last safe MCP metadata preflight:

- Timestamp: `2026-08-03T09:53:16.196877+00:00`
- Public table count: 13
- RLS enabled count: 13
- RLS enabled without policies: 4
- Public function count: 18
- Security definer function count: 18
- Function count without config/search path: 12

## Decisions Locked For Stage 1

- Use additive migration first. Do not start with destructive cleanup.
- Create a new migration file: `supabase/migrations/008_cohorts.sql`.
- Treat `supabase/full_schema_audit_mcp_2026-08-03.md` as the schema contract.
- Use `auth.users` as the membership identity source for `cohort_members`.
- Use `public.users` only as profile/display data where available.
- Backfill all existing personal data into `flow-1`.
- Add admins/experts to `flow-2`; do not add ordinary flow-1 students to `flow-2`.
- Use `p_cohort_id` for RPC parameters to avoid SQL ambiguity.
- Prefer `cohort_material_settings.material_id integer references materials(id)`.
- Key assignment schedule by `hw_number`, not `assignments.id`, unless assignments are normalized first.
- Resolve progress by mapping numeric lesson numbers to `lessons.id uuid`.
- Keep flow-2 schedule empty until real dates exist.
- Keep flow-2 recordings/materials hidden unless explicitly opened.

## Rollback And Safety Requirements

Before applying any migration outside local review:

- Capture schema backup or Supabase branch snapshot if available.
- Save the exact pre-migration function list and routine grants.
- Save the exact pre-migration constraints for affected tables.
- Run the migration first on a safe database or transaction preview.
- Validate that `flow-1` counts do not change unexpectedly after backfill.
- Validate that old unique constraints are replaced only after `cohort_id` backfill succeeds.
- Do not drop old RPC/functions in the foundation migration.
- Do not revoke production grants without separate approval if it can affect live UI.
- Do not reset, truncate, or delete production data.

## Open Decisions Not Blocking Stage 1

- Exact flow-2 lesson dates and homework deadlines.
- Final material mode for flow-2:
  - hide all materials;
  - show structure without links;
  - show only explicitly opened materials.
- Whether `material_urls` remains a current source of truth or becomes legacy after cohort material settings.
- Whether `submit_expert_feedback` is removed, revoked, or replaced by a guarded admin/expert RPC in Stage 2.

## Stage 1 Handoff

Stage 0 is complete. The next implementation step is to draft `supabase/migrations/008_cohorts.sql` as an additive, reviewable migration:

1. create cohort and membership tables;
2. create cohort content/schedule settings tables;
3. add nullable/defaulted `cohort_id` columns;
4. backfill existing production data to `flow-1`;
5. add indexes and new cohort-aware uniqueness;
6. add helper access functions and initial RLS;
7. leave risky RPC cleanup for a separate reviewed security migration.
