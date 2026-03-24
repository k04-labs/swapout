# SwapOut

Behavioral-Based Safety (BBS) assessment platform with three-tier access:

1. `SuperAdmin` (username/password JWT)
2. `SubAdmin` (Google SSO via Better Auth)
3. `Employee` (no login, managed by SubAdmin)

## Tech Stack

1. Next.js 16 (App Router)
2. Prisma + PostgreSQL
3. Better Auth
4. Tailwind CSS + shadcn/ui

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Seed bootstrap data (SuperAdmin + questions):
```bash
npm run prisma:seed
```

5. Start dev server:
```bash
npm run dev
```

## Useful Scripts

1. Type checks:
```bash
npm run typecheck
```

2. Lint:
```bash
npm run lint
```

3. Tests:
```bash
npm run test
```

4. Unit tests only:
```bash
npm run test:unit
```

## Phase 4 Highlights

1. Platform CSV export:
   - `GET /api/super-admin/export/csv`
   - optional `?subAdminId=<id>`
2. Print-ready SuperAdmin report:
   - `/super-admin/employees/[id]/report/print`
3. Rate-limited SuperAdmin login:
   - 5 attempts per 15 minutes
4. Zod validation for key mutation APIs
5. Structured API error envelope + audit logging hooks

## QA Assets

1. Automated tests: `tests/unit/**`, `tests/integration/**`
2. E2E scenarios checklist: [tests/e2e/happy-paths.md](/Users/mdkaifansari04/code/projects/swapout/tests/e2e/happy-paths.md)
3. Deployment runbook: [docs/deployment-checklist.md](/Users/mdkaifansari04/code/projects/swapout/docs/deployment-checklist.md)

