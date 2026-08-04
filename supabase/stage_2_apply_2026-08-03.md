# Stage 2 Apply Report - Cohort RPC and Security

Date: 2026-08-03

Status: applied successfully to Supabase production through Supabase MCP.

Applied migrations:

- `20260803105644 009_cohort_rpc_security`
- `20260803105805 010_assignment_notification_acl`

## Applied Scope

- Added cohort-aware RPC signatures using `p_cohort_id`.
- Kept old flow-1 RPC signatures as transition-compatible functions where they already existed.
- Added cohort guards for student, admin, expert, leaderboard, voting, ratings, and assignment flows.
- Updated point/badge trigger functions to use `NEW.cohort_id`.
- Added cohort-aware RLS policies for personal data tables and direct material visibility.
- Revoked anonymous execution for covered RPCs.
- Kept old unique constraints until frontend writes use cohort-aware conflict targets.
- Restored assignment-submission notifications in follow-up migration `010_assignment_notification_acl`.

## Verification

- `flow-1`: visible, 16 members.
- `flow-2`: hidden, 2 members with admin/expert roles.
- `flow-2`: zero released lessons, visible materials, lesson dates, and assignment deadlines.
- All six cohort foundation/settings tables have RLS enabled and four policies each.
- Personal cohort-aware tables have one restrictive self/cohort policy each; `users` has select/update policies.
- Covered RPCs report `anon_execute = false`.
- `award_badge` and its old/new signatures are not executable by `authenticated`; trigger/assertion helpers are similarly protected.

## Known Residual Risk

- `can_access_cohort(text)` remains executable by `authenticated` because RLS policies invoke it. It has a fixed `search_path` and performs no mutation.
- Supabase advisors still report legacy SECURITY DEFINER/search-path debt and informational unused-index notices. These predate the cohort rollout or are expected until indexes are exercised.
- Old unique constraints remain a transition limitation: physical duplicate per-user rows across cohorts are not yet possible for some tables. Remove them only after Stage 3/4 frontend writes are cohort-aware.
- The current frontend still needs `CohortProvider`, active-cohort propagation, and page-level cohort filters before flow-2 is exposed to students.

## Next Gate

Start Stage 3 with `CohortProvider`, `useCohort()`, the versioned local-storage key, and the admin/expert-only query parameter. Run a flow-1 smoke test before enabling a student-facing cohort switcher.
