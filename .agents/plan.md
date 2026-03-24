# SwapOut Implementation Plan (4 Phases)

This plan turns `.agent/spec.md` into an execution roadmap for the full app build.
It assumes current stack versions in this repo (Next.js 16.2.1, React 19, Tailwind 4).

## Scope Alignment Notes

- Spec is written as `Next.js 14+`, but this project runs `Next.js 16`.
- We will implement route protection with `proxy.ts` (Next 16 convention), not `middleware.ts`.
- We will use async request APIs (`await cookies()`, async `params/searchParams`) everywhere required by Next 16.

## Delivery Strategy

- Each phase has a primary owner domain and can be developed largely in parallel using agreed API contracts and mocked data where needed.
- Integration points are locked at the start of each phase to reduce cross-team blocking.
- Phase gates are strict: no phase closes without test coverage and acceptance checks listed below.

---

## Phase 1: Core Platform + Data + Auth

## Goal
Stand up the production-ready foundation: schema, auth, authorization, app shells, and guardrails.

## Workstreams

- Project foundations:
  - Establish target app structure from spec (`app/(auth)`, `(sub-admin)`, `(super-admin)`, `app/api/**`, `lib/**`, `components/**`, `prisma/**`).
  - Add base UI primitives (shadcn setup, shared design tokens, layout scaffolding).
- Database and models:
  - Implement full Prisma schema (SuperAdmin, SubAdmin auth tables, Employee, Question Bank, Session/Submission/Report models).
  - Generate and run initial migrations.
- Seed + bootstrap:
  - Implement `prisma/seed.ts` and `prisma/seed/questions.json`.
  - Seed SuperAdmin credentials and initial question bank.
- Auth + authorization:
  - SuperAdmin custom JWT login/logout (`/api/super-admin/auth/login|logout`).
  - Better Auth integration for SubAdmin Google SSO (`/api/auth/[...all]`).
  - `requireSuperAdmin()` and `requireSubAdmin()` helpers with approval checks.
  - Route protection in `proxy.ts` for all role-specific areas.
- Security baseline:
  - Secure cookie policies, `.env.example`, secret handling, and baseline error handling.

## Deliverables

- Auth flows working end-to-end for SuperAdmin and SubAdmin.
- Approval-state route gating (pending/rejected/approved behavior).
- Prisma schema + migrations + seed command working.
- Skeleton pages load with role-specific layout shells.

## Exit Criteria

- SuperAdmin can log in/out and access protected super-admin routes only.
- SubAdmin can sign in with Google and is correctly gated by approval status.
- Unauthorized access attempts return correct HTTP status/redirect behavior.
- Fresh setup from scratch works using documented env and seed steps.

---

## Phase 2: SubAdmin Product Surface (Employees + Assessments + Reports)

## Goal
Deliver complete SubAdmin operational workflows from employee registration to assessment submission and reporting.

## Workstreams

- SubAdmin dashboard and employee management:
  - Build `/sub-admin/dashboard`, `/sub-admin/employees`, employee detail/edit flows.
  - Implement employee CRUD APIs restricted by `subAdminId`.
- Assessment engine:
  - Implement assessment session start/resume/submit APIs.
  - Enforce 8 random active questions + persisted `AssessmentSessionQuestion`.
  - Implement scoring (`totalScore`, competency breakdown, trend logic, remark banding).
  - Prevent double-submit and enforce session ownership/status checks.
- Reporting:
  - Build `/sub-admin/employees/[id]/report` and print route.
  - Add trend chart, competency chart, history table, latest remark card.
  - Implement per-employee CSV export endpoint.
- Shared components:
  - `AssessmentForm`, `QuestionBlock`, `EmployeeTable`, `RemarkBadge`, `TrendIndicator`, `ScoreBadge`, chart components.

## Deliverables

- SubAdmin can fully manage own employees.
- SubAdmin can complete assessment flow with deterministic session behavior.
- Employee report reflects accurate derived metrics after every submission.

## Exit Criteria

- No cross-tenant leakage (SubAdmin A cannot read/write SubAdmin B employee data).
- Assessment submission writes consistent Session + Submission + Response + Report state.
- Report numbers (latest, average, trend, breakdown) match backend calculations.


## Phase 3: SuperAdmin Control Center (Platform Oversight + Question Bank)

## Goal
Deliver all SuperAdmin operational and monitoring capabilities across the platform.

## Workstreams

- SuperAdmin dashboard:
  - Implement platform metrics API and UI cards.
  - Implement leaderboard API + UI (composite score formula from spec).
  - Add recent activity feed.
- SubAdmin management:
  - Build `/super-admin/sub-admins` list and filters.
  - Implement approve/reject/revoke APIs.
  - Build SubAdmin detail view with profile/stats/employees/history.
- Platform employee visibility:
  - Build `/super-admin/employees` and employee detail/report views.
  - Add search/filter support (site/department/subAdmin).
- Question bank:
  - Full CRUD + activate/deactivate flows for questions and options.
  - Reuse/extend question form modal components.

## Deliverables

- SuperAdmin can govern sub-admin lifecycle and platform access.
- SuperAdmin has full cross-platform observability.
- Question bank is manageable via UI and APIs.

## Exit Criteria

- Approval transitions are reflected immediately in protected sub-admin access.
- Dashboard metrics and leaderboard are correct against DB state.
- Question CRUD operations preserve option score integrity and category consistency.

---

## Phase 4: Exports, Hardening, QA, and Release Readiness

## Goal
Stabilize for production use with security hardening, exports, observability, and deployment readiness.

## Workstreams

- Export/report completion:
  - Platform-wide CSV export (`/api/super-admin/export/csv`).
  - Finalize print-ready report routes for both roles.
- Security and resilience:
  - Rate-limit SuperAdmin login (5 attempts/15 min).
  - Add input validation schemas (zod) for all mutation endpoints.
  - Add structured API error responses and audit-friendly logging hooks.
- QA and automated testing:
  - Unit tests for scoring/remark/trend logic.
  - API integration tests for auth and tenancy guards.
  - E2E happy paths for both roles (login, approve, employee add, assess, report).
- DevEx and release:
  - Update README with setup/run/seed/test instructions.
  - Add deployment checklist (env, database migration, seed strategy, rollback notes).

## Deliverables

- Complete export + print functionality in scope.
- Security controls and validation in place.
- Test suite covering critical flows and regression hotspots.
- Deployment-ready documentation and operational checklist.

## Exit Criteria

- Critical user journeys pass E2E in clean environment.
- No high-severity auth/authorization/security gaps remain.
- Production deployment dry run succeeds with documented runbook.

---

## Cross-Phase Contracts (to keep phases independent)

- Shared API response format and error envelope defined before implementation.
- Shared domain enums/constants (`ApprovalStatus`, `CompetencyCategory`, remark bands) live in one place.
- UI component contracts (props + data shapes) are frozen per phase start.
- Feature flags/stubs can be used to unblock frontend/backend parallel work.

## Known Open Decisions

- Better Auth table naming compatibility (`SubAdmin` vs `User`) must be validated early in Phase 1.
- Leaderboard formula weights need business sign-off.
- Question bank seed depth (target 100+ questions) impacts report quality and test realism.

## Suggested Execution Sequence

1. Start Phase 1 immediately and lock core contracts by end of week 1.
2. Run Phase 2 and Phase 3 in parallel once auth + schema + shared contracts are stable.
3. Run Phase 4 after both product surfaces are integrated.
