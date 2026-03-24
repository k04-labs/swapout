# Deployment Checklist

## Pre-Deploy

1. Ensure all required env vars are set (`DATABASE_URL`, `JWT_SECRET`, Better Auth + Google OAuth vars).
2. Run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
3. Verify database connectivity from deployment target.

## Database

1. Apply migrations:
   - `npm run prisma:migrate`
2. Seed bootstrap data (first deployment only):
   - `npm run prisma:seed`
3. Confirm seeded SuperAdmin user exists.

## Rollout

1. Deploy app build.
2. Smoke test:
   - SuperAdmin login/logout.
   - SubAdmin login and approval gating.
   - Employee creation and assessment submission.
   - CSV export routes.
3. Confirm logs include audit events for:
   - login success/failure
   - sub-admin approval actions
   - assessment submissions
   - CSV exports

## Rollback Notes

1. Roll back app version first if runtime issues appear.
2. For migration issues, restore DB from latest backup/snapshot.
3. Re-run smoke tests after rollback.

