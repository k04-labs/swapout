# SwapOut E2E Happy Paths

These are the production-critical journeys to verify in a clean environment.

## SuperAdmin Journey

1. Open `/super-admin/login`.
2. Login with seeded credentials.
3. Open `/super-admin/sub-admins` and approve a pending SubAdmin.
4. Open `/super-admin/employees` and verify platform employee visibility.
5. Download `/api/super-admin/export/csv` and confirm CSV headers/content.

## SubAdmin Journey

1. Open `/login` and sign in with Google.
2. If newly registered, confirm pending state until approved.
3. After approval, open `/sub-admin/employees` and add an employee.
4. Start an assessment from employee detail and submit all responses.
5. Open employee report, export CSV, and open print view.

## Guardrails

1. SubAdmin A cannot open SubAdmin B employee detail/report endpoints.
2. Invalid SuperAdmin login repeatedly should return 429 after 5 attempts in 15 minutes.
3. Questions already used in submissions cannot have options changed or be deleted.

