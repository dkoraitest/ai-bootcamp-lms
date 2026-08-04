# Project Instructions: LMS Platform Bootcamp

## Communication

- Reply in Russian by default.
- Keep explanations concise, but include enough product and technical context for decisions.
- The user is a product manager: explain why a technical choice matters for product risk, rollout, and data safety.
- Do not commit to GitHub without asking first.

## Safety

- Never print secrets from `.env.local`, logs, Supabase keys, database URLs, or customer/student data.
- Never run destructive database operations without explicit confirmation.
- Do not delete or revert unrelated local changes.
- Treat production Supabase as high risk. Prefer additive migrations first, then cleanup after verification.

## Current Feature Plan: Multi-Cohort LMS

Goal: add support for multiple course cohorts and a cohort switcher, while keeping all current flow-1 data unchanged and preventing flow-2 data from leaking to flow-1 students.

Primary planning docs:

- `plans.md`
- `supabase/full_schema_audit_mcp_2026-08-03.md`
- `supabase/stage_0_completion_2026-08-03.md`
- `supabase/stage_1_apply_2026-08-03.md`
- `supabase/stage_2_draft_2026-08-03.md`
- `supabase/stage_2_apply_2026-08-03.md`
- `supabase/stage_3_frontend_2026-08-03.md`
- `supabase/stage_4_frontend_integration_2026-08-03.md`
- `supabase/stage_5_qa_2026-08-03.md`
- `supabase/schema_audit_2026-08-03.md`
- `supabase/schema_audit_service_role_2026-08-03.md`

Supabase MCP:

- MCP server name: `supabase`.
- Project ref: `psjfokjdghhcxfqzrxpw`.
- MCP URL: `https://mcp.supabase.com/mcp?project_ref=psjfokjdghhcxfqzrxpw&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching`.
- The server was added and OAuth login succeeded on 2026-08-03.
- If Supabase MCP tools are not visible in the active Codex session, restart the session and verify with `codex mcp list` or `/mcp`.
- Prefer Supabase MCP for database/schema/RPC inspection once the tools are visible.

## Implementation Strategy

Use staged implementation with limited parallelism. Do not launch multiple agents to implement the whole feature at once. The biggest risk is data mixing and breaking the existing cohort, not speed.

Parallel agents may be used only after contracts are fixed:

- one agent may draft SQL/RPC changes;
- one agent may audit frontend touchpoints and lesson id mapping;
- one agent may prepare QA/security checks.

Code and migration edits should be integrated centrally to avoid conflicting SQL, hook, and RLS changes.

## Agent Roles

### `schema-audit-prep`

Purpose: validate and close Stage 0 before any cohort migration.

Use this agent for:

- comparing `plans.md` against the actual Supabase schema audit;
- checking coverage for columns/types, constraints, indexes, RLS policies, grants, RPC/functions, triggers, advisors, logs, and migration history;
- maintaining `supabase/stage_0_completion_2026-08-03.md`;
- identifying blockers before `supabase/migrations/008_cohorts.sql`.

Safety limits:

- do not apply production DDL;
- do not run destructive operations;
- do not print or store secrets, emails, tokenized URLs, private student rows, or submission text;
- write only documentation/checklist updates unless explicitly asked to draft a migration.

## Stages

### Stage 0. Full DB Audit

Status: completed through Supabase MCP on 2026-08-03.

Completion gate:

- `supabase/full_schema_audit_mcp_2026-08-03.md`
- `supabase/stage_0_completion_2026-08-03.md`

Before writing `008_cohorts.sql`, use the full MCP audit as the schema contract:

- columns and exact types;
- unique constraints and foreign keys;
- indexes;
- RLS policies;
- grants;
- full SQL definitions for all RPC/functions/triggers.

Full MCP audit confirmed:

- `cohorts` and cohort settings tables do not exist yet;
- `cohort_id` is absent from target tables;
- `materials.id` and `materials.lesson_id` are `integer`;
- `lessons.id` and `student_progress.lesson_id` are `uuid`;
- `assignment_submissions.assignment_id` is `integer` and behaves as `hw_number`;
- `assignments` has 0 rows in production;
- `auth.users` has 16 rows, `public.users` has 13 rows, and 3 auth users have no public profile;
- `review_assignment_submission` exists in Supabase but is missing from tracked SQL;
- `increment_points` and `award_badge` are exposed as RPC and need guards or revokes.
- `submit_expert_feedback` is high risk because it updates submissions/points without a role check.

### Stage 1. SQL Foundation, Additive Only

Status: applied to Supabase production through MCP on 2026-08-03.

Applied migration:

- `20260803100948 008_cohorts`
- local file: `supabase/migrations/008_cohorts.sql`
- apply report: `supabase/stage_1_apply_2026-08-03.md`

- Create `cohorts` and `cohort_members`.
- Create cohort content/settings tables:
  - `cohort_lesson_settings`;
  - `cohort_material_settings`;
  - `cohort_lesson_schedule`;
  - `cohort_assignment_schedule`.
- Add `cohort_id` to personal/user-generated tables.
- Backfill all existing rows as `flow-1`.
- Add existing users to `flow-1`.
- Add admins/experts to `flow-2`.
- Add required indexes.
- Avoid removing old RPC during this stage.
- Old unique constraints were intentionally preserved for legacy RPC compatibility.
- Post-apply cleanup candidate: replace new cohort-table `admin_all` policies with separate insert/update/delete admin policies to remove Supabase `multiple_permissive_policies` performance lints.

### Stage 2. RPC and Security

Status: applied to Supabase production through MCP on 2026-08-03.

Applied migrations:

- `supabase/migrations/009_cohort_rpc_security.sql`
- `supabase/migrations/010_assignment_notification_acl.sql`
- apply report: `supabase/stage_2_apply_2026-08-03.md`

- Recreate RPC with `p_cohort_id` parameters.
- Use `p_cohort_id`, not `cohort_id`, to avoid SQL ambiguity.
- Every `security definer` RPC must check `can_access_cohort(p_cohort_id)` or `is_admin_or_expert()`.
- Update triggers to write points/badges into `NEW.cohort_id`.
- Protect or revoke direct access to internal RPC such as `increment_points` and `award_badge`.
- Export and version `review_assignment_submission` before changing assignment review flow.
- Add or update RLS policies for all cohort-aware tables.
- Do not drop old unique constraints until frontend direct upserts use cohort-aware conflict targets.

Verification after apply:

- `flow-1`: visible, 16 members; `flow-2`: hidden, 2 admin/expert members.
- `flow-2` has zero released lessons, visible materials, lesson dates, or assignment deadlines.
- New cohort-aware RPC signatures are present; covered RPCs reject `anon` execution.
- Existing old unique constraints remain intentionally for frontend transition compatibility.
- `can_access_cohort(text)` remains executable by `authenticated` because RLS policies call it; it is not a client data mutation API.
- Supabase advisors still report legacy SECURITY DEFINER/search-path debt and unused-index informational notices; these are tracked separately from the cohort rollout.

### Stage 3. Frontend Context

Status: completed locally on 2026-08-03.

Implementation files:

- `src/lib/cohort/CohortProvider.tsx`
- `src/lib/types.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/TopBar.tsx`

- Add `CohortProvider` and `useCohort()`.
- Load available cohorts via `get_available_cohorts()`, not direct client-side policy logic.
- Store active cohort in `localStorage` with a versioned key, for example `lms.activeCohortId.v1`.
- Support `?cohort=flow-2` for admin/expert only.
- If selected cohort is unavailable, fall back to the first accessible cohort.
- Add the switcher to `TopBar`.

Delivered behavior:

- loading skeleton, inline error state, and retry action are present in `TopBar`;
- a stored cohort is accepted only when it is returned by `get_available_cohorts()`;
- `?cohort=...` is accepted for the current admin/expert contract, which exposes a hidden cohort;
- invalid or unauthorized query values fall back to the first accessible cohort and are removed from the URL;
- page-level data queries were completed in Stage 4; the remaining gate is role/data-isolation QA.

### Stage 4. Page Integration

Status: completed locally on 2026-08-03. Report: `supabase/stage_4_frontend_integration_2026-08-03.md`.

Integrated:

- dashboard home;
- program;
- materials;
- assignments;
- progress;
- skills;
- peer review and leaderboard;
- projects voting;
- admin projects;
- admin final ratings;
- `recordVisit`;
- `recordLaunch`;
- registration flow, backed by migration `011_registration_cohort_bootstrap`.

Important lesson-id issue:

- `student_progress.lesson_id` is `uuid`, while parts of the frontend use numeric lesson ids.
- Resolved by mapping `lesson_number` to `lessons.id` before progress queries/upserts.
- Cohort-aware progress writes use `cohort_id,user_id,lesson_id`.
- Flow 2 without published schedule has neutral dates/deadlines and no flow-1 recording fallback.
- Dashboard/progress do not show flow-1 day/week labels when the active cohort has no start date; visit/launch week calculation uses the active cohort start date.

### Stage 5. QA and Rollout

Status: backend/RLS and automated checks completed on 2026-08-03; manual authenticated browser pass remains open. Report: `supabase/stage_5_qa_2026-08-03.md`.

Verify:

- student in flow-1 sees only flow-1;
- admin/expert sees flow-1 and flow-2;
- flow-1 data remains unchanged;
- flow-2 has no old points, progress, submissions, votes, ratings, visits, launches, notifications, or recordings;
- flow-2 without schedule does not show flow-1 dates/deadlines;
- direct RPC/select attempts for flow-2 by a flow-1 student fail;
- leaderboard, final ratings, and project votes are cohort-scoped;
- lesson completion and badges write into the active cohort;
- app build passes.
- direct client execution of internal `increment_points` is revoked; launches use guarded `record_agent_launch(p_cohort_id)`.

## Product Decisions Still Needed

- Flow-2 schedule is not known yet. Until dates are added, flow-2 should show an empty or neutral schedule state, not flow-1 dates.
- Decide materials mode for flow-2:
  - hide all materials;
  - show lesson/homework structure without recordings/materials;
  - show only materials explicitly opened by admin.

Recommended materials mode: explicit admin-controlled visibility through `cohort_material_settings`.

## Verification Defaults

- For docs-only changes, no app tests are required.
- For frontend changes, run `npm run build` when feasible.
- For SQL changes, verify on a safe database or SQL Editor transaction before applying to production.
- Always report what was changed and what was verified.
