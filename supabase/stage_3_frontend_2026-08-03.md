# Stage 3 Frontend Context Report

Date: 2026-08-03

Status: completed locally.

## Delivered

- Added `CohortProvider` and `useCohort()`.
- Connected the provider to the dashboard layout.
- Loaded available cohorts through `get_available_cohorts()`.
- Added versioned local storage key `lms.activeCohortId.v1`.
- Added fallback to the first accessible cohort when stored or query-selected cohort is unavailable.
- Added guarded `?cohort=...` handling for the current admin/expert contract.
- Added the `TopBar` cohort selector with loading, error, retry, and keyboard-accessible native select states.
- Added the `Cohort` TypeScript type.

## Scope Boundary

The active cohort is now available through `useCohort()`, but existing page queries still use their legacy flow-1 behavior. Page-level propagation is Stage 4 work and must happen before exposing flow-2 to students.

## Verification

- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; all 17 static pages generated.
- `git diff --check`: passed.

## Next Gate

Start Stage 4 page integration. Prioritize `program`, `materials`, `assignments`, `progress`, `recordVisit`, and `recordLaunch`, while resolving the existing numeric lesson-id versus UUID mismatch before changing progress writes.
