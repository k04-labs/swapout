# SwapOut — BBS Assessment Platform
## Technical Specification v2.0
> Behavioral-Based Safety (BBS) Assessment Platform | ISO 45001 aligned
> Stack: Next.js 14+ · Prisma · PostgreSQL · Better Auth · Tailwind CSS · shadcn/ui

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Personas & Role Architecture](#2-personas--role-architecture)
3. [System Architecture](#3-system-architecture)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Database Schema](#5-database-schema)
6. [SuperAdmin Flows](#6-superadmin-flows)
7. [SubAdmin Flows](#7-subadmin-flows)
8. [Employee (End-User) Flows](#8-employee-end-user-flows)
9. [Assessment & Scoring Engine](#9-assessment--scoring-engine)
10. [Remark System v0](#10-remark-system-v0)
11. [Reporting & Export](#11-reporting--export)
12. [API Routes](#12-api-routes)
13. [Frontend Pages & Components](#13-frontend-pages--components)
14. [Question Bank & Seeding](#14-question-bank--seeding)
15. [Environment & Configuration](#15-environment--configuration)
16. [Security Considerations](#16-security-considerations)
17. [Project File Structure](#17-project-file-structure)
18. [Phase Roadmap](#18-phase-roadmap)
19. [Open / Deferred Items](#19-open--deferred-items)

---

## 1. Project Overview

SwapOut is an internal three-tier Behavioral-Based Safety (BBS) assessment platform.

- A **SuperAdmin** (security officer manager) manages the platform, approves SubAdmins, and has full visibility over all data.
- **SubAdmins** (field safety officers) register via Google SSO, get approved by SuperAdmin, and then register employees and submit assessments on their behalf.
- **Employees** (workers) are not app users — they have no login. They are registered by a SubAdmin and their assessments are submitted by the SubAdmin. Each employee has a progress report with a remark score out of 5.

The application has no public-facing landing page. It is a private internal tool accessible by direct URL.

---

## 2. Personas & Role Architecture

| Persona | Auth Method | Registered By | Can Log In | App Access |
|---|---|---|---|---|
| SuperAdmin | Username + Password (JWT) | Seeded in DB | Yes | Full platform |
| SubAdmin | Google SSO (Better Auth) | Self-register | Yes | Own dashboard (locked until approved) |
| Employee | No login | SubAdmin via form | No | None — assessments submitted on their behalf |

### Key Constraints
- SuperAdmin is a **single seeded account** — no UI to create more.
- SubAdmins **cannot act** until SuperAdmin approves them. They see a locked dashboard with a "Pending Approval" state.
- Employees are plain data records — no auth, no sessions, no login flow.
- SubAdmin A cannot see or interact with SubAdmin B's employees.
- SuperAdmin can see all SubAdmins and all employees across the platform.
- One assessment session = 8 randomly selected questions from the pool, submitted once by SubAdmin on behalf of the employee.
- Each submission generates a remark (score out of 5) which contributes to the employee's progress report.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Next.js App (App Router)                  │
│                                                                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  /app/super-    │  │  /app/sub-admin  │  │  /app/auth      │  │
│  │  admin/**       │  │  /**             │  │  /**            │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                    │                      │           │
│  ┌────────▼────────────────────▼──────────────────────▼────────┐  │
│  │                  /app/api  (Route Handlers)                  │  │
│  │   /api/auth/**   /api/super-admin/**   /api/sub-admin/**     │  │
│  └─────────────────────────────┬───────────────────────────────┘  │
│                                │                                   │
│  ┌─────────────────────────────▼───────────────────────────────┐  │
│  │               Better Auth  (SubAdmin Session Layer)          │  │
│  └─────────────────────────────┬───────────────────────────────┘  │
│                                │                                   │
│  ┌─────────────────────────────▼───────────────────────────────┐  │
│  │                  Prisma ORM  ↔  PostgreSQL                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth (SubAdmin) | Better Auth — Google OAuth 2.0 |
| Auth (SuperAdmin) | Custom JWT — username + password |
| ORM | Prisma |
| Database | PostgreSQL |
| CSV Export | csv-stringify |
| Print Export | Browser print API + Tailwind print utilities |
| Question Seeding | `questions.json` → `prisma/seed.ts` |

---

## 4. Authentication & Authorization

### 4.1 SuperAdmin — Username + Password (JWT)

- SuperAdmin visits `/super-admin/login`.
- Submits username + password (bcrypt-hashed in DB).
- Server validates → signs JWT: `{ superAdminId, role: "super_admin" }`, expiry `8h`.
- JWT stored in `httpOnly` cookie: `super_admin_token`.
- All `/api/super-admin/**` routes are protected by `requireSuperAdmin()` middleware.
- Logout clears the cookie.

```ts
// lib/super-admin-auth.ts
export async function requireSuperAdmin(request: Request) {
  const token = cookies().get("super_admin_token")?.value
  if (!token) throw new UnauthorizedError()
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { superAdminId: string, role: string }
  if (payload.role !== "super_admin") throw new UnauthorizedError()
  return payload
}
```

---

### 4.2 SubAdmin — Google SSO (Better Auth)

- SubAdmin visits `/login` → clicks "Continue with Google".
- Better Auth handles OAuth 2.0 → creates/updates `SubAdmin` record in DB with `approvalStatus: "PENDING"`.
- After login, middleware checks `approvalStatus`:
  - `PENDING` → redirect to `/sub-admin/pending` (locked dashboard, all actions disabled).
  - `APPROVED` → redirect to `/sub-admin/dashboard` (full access).
  - `REJECTED` → redirect to `/sub-admin/rejected` (informational page).
- Session managed via Better Auth cookie.
- All `/api/sub-admin/**` routes protected by `requireSubAdmin()` — checks session AND `approvalStatus === "APPROVED"`.

```ts
// lib/sub-admin-auth.ts
export async function requireSubAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new UnauthorizedError()
  const subAdmin = await prisma.subAdmin.findUnique({ where: { id: session.user.id } })
  if (!subAdmin || subAdmin.approvalStatus !== "APPROVED") throw new ForbiddenError()
  return subAdmin
}
```

---

### 4.3 Middleware Route Protection (`middleware.ts`)

```
/super-admin/**          → requires valid super_admin_token cookie
/sub-admin/dashboard/**  → requires Better Auth session + approvalStatus = APPROVED
/sub-admin/pending       → requires Better Auth session (any approval status)
/sub-admin/rejected      → requires Better Auth session (any approval status)
/login                   → public
/super-admin/login       → public
```

---

## 5. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// SUPER ADMIN
// ─────────────────────────────────────────

model SuperAdmin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

// ─────────────────────────────────────────
// BETTER AUTH REQUIRED TABLES
// (SubAdmin is the "user" in Better Auth's model)
// ─────────────────────────────────────────

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model SubAdmin {
  id             String         @id @default(cuid())
  name           String
  email          String         @unique
  emailVerified  Boolean        @default(false)
  image          String?
  approvalStatus ApprovalStatus @default(PENDING)
  approvedAt     DateTime?
  approvedBy     String?        // superAdminId who approved
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  sessions   Session[]
  accounts   Account[]
  employees  Employee[]
  submissions AssessmentSubmission[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  subAdmin  SubAdmin @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  subAdmin              SubAdmin  @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─────────────────────────────────────────
// EMPLOYEES (no login — registered by SubAdmin)
// ─────────────────────────────────────────

model Employee {
  id           String   @id @default(cuid())
  fullName     String
  department   String
  jobRole      String
  phoneNumber  String
  site         String
  subAdminId   String   // who registered this employee
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subAdmin    SubAdmin               @relation(fields: [subAdminId], references: [id])
  submissions AssessmentSubmission[]
  report      EmployeeReport?
}

// ─────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────

enum CompetencyCategory {
  HAZARD_RECOGNITION
  INCIDENT_RESPONSE
  COMPLIANCE_AWARENESS
  RISK_ASSESSMENT
  BEHAVIORAL_ACCOUNTABILITY
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

model Question {
  id         String             @id @default(cuid())
  text       String
  category   CompetencyCategory
  difficulty DifficultyLevel    @default(EASY)
  isActive   Boolean            @default(true)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  options   QuestionOption[]
  responses AssessmentResponse[]
}

model QuestionOption {
  id           String   @id @default(cuid())
  questionId   String
  text         String
  // Raw score: 0.0 – 5.0 (this IS the 0–5 scale)
  score        Float
  // Human-readable weight label
  weightLabel  String   // e.g. "Never", "Rarely", "Sometimes", "Usually", "Always"
  question     Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  responses    AssessmentResponse[]
}

// ─────────────────────────────────────────
// ASSESSMENT SESSIONS
// ─────────────────────────────────────────

// An AssessmentSession is created when SubAdmin opens the assessment form for an employee.
// It persists the 8 randomly selected questions (so a refresh doesn't re-randomize mid-session).
// It is either COMPLETED (submitted) or ABANDONED (if left open too long — optional cleanup).

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model AssessmentSession {
  id          String        @id @default(cuid())
  employeeId  String
  subAdminId  String
  status      SessionStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now())
  completedAt DateTime?

  // The 8 questions randomly assigned to this session (stored to prevent re-randomization)
  sessionQuestions AssessmentSessionQuestion[]
  submission       AssessmentSubmission?
}

model AssessmentSessionQuestion {
  id        String            @id @default(cuid())
  sessionId String
  questionId String
  position  Int               // 1–8, display order
  session   AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question  Question          @relation(fields: [questionId], references: [id])

  @@unique([sessionId, questionId])
  @@unique([sessionId, position])
}

// ─────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────

model AssessmentSubmission {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  employeeId  String
  subAdminId  String   // who submitted on behalf of employee
  totalScore  Float    // average of 8 option scores, 0.0–5.0
  remark      String   // e.g. "Needs Improvement", "Satisfactory", etc.
  remarkScore Int      // 1–5 integer band
  submittedAt DateTime @default(now())

  // Per-category breakdown stored as JSON
  // { "HAZARD_RECOGNITION": 3.5, "INCIDENT_RESPONSE": 4.0, ... }
  competencyBreakdown Json?

  session   AssessmentSession    @relation(fields: [sessionId], references: [id])
  employee  Employee             @relation(fields: [employeeId], references: [id])
  subAdmin  SubAdmin             @relation(fields: [subAdminId], references: [id])
  responses AssessmentResponse[]
}

model AssessmentResponse {
  id           String               @id @default(cuid())
  submissionId String
  questionId   String
  optionId     String
  score        Float                // copied from QuestionOption.score at submission time
  submission   AssessmentSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  question     Question             @relation(fields: [questionId], references: [id])
  option       QuestionOption       @relation(fields: [optionId], references: [id])
  createdAt    DateTime             @default(now())
}

// ─────────────────────────────────────────
// EMPLOYEE PROGRESS REPORT
// (One report per employee — updated after each submission)
// ─────────────────────────────────────────

model EmployeeReport {
  id                   String   @id @default(cuid())
  employeeId           String   @unique
  totalSubmissions     Int      @default(0)
  latestScore          Float?   // 0.0–5.0
  latestRemarkScore    Int?     // 1–5
  latestRemark         String?
  averageScore         Float?   // rolling average across all submissions
  highestScore         Float?
  lowestScore          Float?
  trend                String?  // "improving" | "declining" | "stable" | null
  lastAssessedAt       DateTime?
  updatedAt            DateTime @updatedAt

  employee Employee @relation(fields: [employeeId], references: [id])
}
```

---

## 6. SuperAdmin Flows

### 6.1 SuperAdmin Login (`/super-admin/login`)
- Username + password form.
- `POST /api/super-admin/auth/login` → bcrypt compare → set `super_admin_token` JWT cookie.
- Redirect to `/super-admin/dashboard`.
- Logout: `POST /api/super-admin/auth/logout` → clears cookie.

---

### 6.2 SuperAdmin Dashboard (`/super-admin/dashboard`)

**Metrics cards (top row):**
- Total SubAdmins (Approved / Pending / Rejected)
- Total Employees across platform
- Total Assessments submitted (all time)
- Platform average score (all submissions)

**SubAdmin leaderboard table:**
Ranked by composite score using: assessments submitted + employees enrolled + submission consistency (submissions per week over last 30 days).

| Column | Description |
|---|---|
| Rank | #1, #2, #3… |
| SubAdmin Name | Name + avatar |
| Employees Enrolled | Count |
| Assessments Submitted | Count |
| Avg Employee Score | Average across their employees |
| Consistency Score | Submissions in last 30 days / weeks active |
| Status | Approved badge |
| Action | View Profile |

**Recent activity feed:** Latest 10 submissions across all SubAdmins.

---

### 6.3 SubAdmin Management (`/super-admin/sub-admins`)

- Tabs: All / Pending / Approved / Rejected.
- Table: Name, Email, Google Avatar, Registered At, Employees Count, Assessments Count, Status, Actions.
- **Approve** button (Pending only): sets `approvalStatus = APPROVED`, `approvedAt = now()`.
- **Reject** button (Pending only): sets `approvalStatus = REJECTED`.
- **Revoke** button (Approved only): sets `approvalStatus = PENDING` (re-locks SubAdmin).
- Click row → SubAdmin detail page.

**SubAdmin Detail (`/super-admin/sub-admins/[id]`):**
- Profile card (name, email, joined, status, approval date).
- Stats: employees enrolled, total assessments, avg score.
- Employee list (same view as SubAdmin sees, but read-only for SuperAdmin).
- Assessment history table (all submissions by this SubAdmin).

---

### 6.4 All Employees (`/super-admin/employees`)
- List of ALL employees across the entire platform.
- Columns: Name, Department, Job Role, Site, SubAdmin (who registered), Last Assessed, Latest Score, Latest Remark.
- Search by name, filter by site/department/subAdmin.
- Click row → Employee detail page (same view as SubAdmin's employee detail, but SuperAdmin sees all).

---

### 6.5 SuperAdmin Question Bank (`/super-admin/questions`)
- Full CRUD on questions (add, edit, deactivate, delete).
- Same UI as described in Section 14.
- SuperAdmin is the only one who can manage questions.

---

## 7. SubAdmin Flows

### 7.1 SubAdmin Registration
- Visits `/login` → "Continue with Google" → Better Auth creates `SubAdmin` record with `approvalStatus: PENDING`.
- Redirected to `/sub-admin/pending`.

### 7.2 Pending State (`/sub-admin/pending`)
- Shows: "Your account is pending approval by the administrator."
- Dashboard UI is visible but ALL buttons and navigation links are disabled (greyed out, `pointer-events: none`, `opacity-50`).
- A banner at the top explains the pending state.
- SubAdmin can log out.
- No API calls are allowed (server enforces `approvalStatus === APPROVED` on all `/api/sub-admin/**` routes).

### 7.3 SubAdmin Dashboard (`/sub-admin/dashboard`)
*Only accessible after approval.*

**Metrics cards:**
- Total Employees Enrolled (by this SubAdmin)
- Total Assessments Submitted
- Average Employee Score
- Employees with no recent assessment (last 30 days)

**Employee list (quick access):** last 5 employees added, with "View" buttons.

**Recent submissions:** last 5 assessment submissions.

---

### 7.4 Employee Management (`/sub-admin/employees`)

**Employee List:**
- Table: Full Name, Department, Job Role, Phone, Site, Enrolled Date, Last Assessed, Latest Score, Actions.
- "Add Employee" button → opens modal/drawer form.
- Actions per row: Edit | View Report | Submit Assessment.

**Add / Edit Employee Form (modal):**

| Field | Type | Required |
|---|---|---|
| Full Name | Text | Yes |
| Department | Text | Yes |
| Job Role | Text | Yes |
| Phone Number | Text | Yes |
| Site / Location | Text | Yes |

On create: `POST /api/sub-admin/employees` — new `Employee` record with `subAdminId` from session.
On edit: `PATCH /api/sub-admin/employees/[id]` — only the registering SubAdmin can edit.

**Employee Detail Page (`/sub-admin/employees/[id]`):**
- Profile card (all fields + enrolled date).
- Progress summary: total assessments, avg score, trend, latest remark.
- "Submit New Assessment" button (calls assessment flow).
- Assessment history table: date, score, remark, submitted by.
- "View Full Report" button → employee report page.

---

### 7.5 Submit Assessment (`/sub-admin/employees/[id]/assess`)

**Flow:**
1. SubAdmin clicks "Submit New Assessment" on employee detail.
2. `POST /api/sub-admin/assessments/start` with `{ employeeId }`:
   - Creates `AssessmentSession` record.
   - Randomly selects 8 active questions from the pool.
   - Creates 8 `AssessmentSessionQuestion` records (with position 1–8).
   - Returns session ID + question data with shuffled options.
3. SubAdmin sees scrollable form with 8 questions and 4 options each (radio buttons).
4. All 8 questions must be answered before submitting (client-side validation).
5. SubAdmin clicks "Submit Assessment".
6. `POST /api/sub-admin/assessments/[sessionId]/submit` with `{ responses: [{ questionId, optionId }] }`:
   - Validates session belongs to this SubAdmin + is IN_PROGRESS.
   - Computes `totalScore`, `remarkScore`, `remark`, `competencyBreakdown`.
   - Creates `AssessmentSubmission` + 8 `AssessmentResponse` records.
   - Updates `AssessmentSession.status = COMPLETED`.
   - Upserts `EmployeeReport` for this employee.
7. Redirect to `/sub-admin/employees/[id]` with success toast.

**Guard:** If an `IN_PROGRESS` session already exists for this employee (e.g. SubAdmin opened and closed browser), server returns the existing session questions (no re-randomization). If `COMPLETED` exists, always create a new session.

---

### 7.6 Employee Progress Report (`/sub-admin/employees/[id]/report`)
- Score trend line chart (all submissions over time, x = date, y = score 0–5).
- Latest remark card (score badge + remark label + description).
- Competency breakdown bar chart (per-category average scores across all submissions).
- Assessment history table (date, score out of 5, remark, questions answered).
- "Print Report" button → opens print view.
- "Export CSV" button → downloads CSV of this employee's history.

---

## 8. Employee (End-User) Flows

Employees have **no login and no app access.** They are entirely passive data subjects.

- Registered by SubAdmin via form.
- Assessments submitted on their behalf by SubAdmin.
- Progress tracked in `EmployeeReport`.
- Reports visible to their SubAdmin and to SuperAdmin.

---

## 9. Assessment & Scoring Engine

### 9.1 Random Question Selection

When a new session is started:

```ts
async function startAssessmentSession(employeeId: string, subAdminId: string) {
  // Get all active questions
  const allQuestions = await prisma.question.findMany({
    where: { isActive: true },
    include: { options: true },
  })

  // Shuffle and pick 8
  const selected = allQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)

  // Create session
  const session = await prisma.assessmentSession.create({
    data: {
      employeeId,
      subAdminId,
      status: "IN_PROGRESS",
      sessionQuestions: {
        create: selected.map((q, index) => ({
          questionId: q.id,
          position: index + 1,
        })),
      },
    },
    include: { sessionQuestions: { include: { question: { include: { options: true } } } } },
  })

  // Shuffle options for each question before returning
  return session.sessionQuestions
    .sort((a, b) => a.position - b.position)
    .map((sq) => ({
      ...sq.question,
      options: sq.question.options.sort(() => Math.random() - 0.5),
    }))
}
```

### 9.2 Score Computation

```ts
function computeScores(responses: { questionId: string; optionId: string }[], options: QuestionOption[]) {
  // Map optionId -> score
  const optionScoreMap = Object.fromEntries(options.map((o) => [o.id, o.score]))

  // Total score: average of 8 option scores (0.0–5.0)
  const scores = responses.map((r) => optionScoreMap[r.optionId] ?? 0)
  const totalScore = scores.reduce((a, b) => a + b, 0) / scores.length

  // Per-category breakdown
  // (requires joining response -> question -> category)
  // See full implementation in lib/scoring.ts

  return { totalScore, ...computeCompetencyBreakdown(responses, options) }
}
```

### 9.3 Competency Breakdown

Group responses by `Question.category`, average the scores within each group:

```ts
function computeCompetencyBreakdown(responses, questionsWithOptions) {
  const categoryGroups: Record<string, number[]> = {}

  for (const response of responses) {
    const question = questionsWithOptions.find((q) => q.id === response.questionId)
    const option = question?.options.find((o) => o.id === response.optionId)
    if (!question || !option) continue

    if (!categoryGroups[question.category]) categoryGroups[question.category] = []
    categoryGroups[question.category].push(option.score)
  }

  const breakdown: Record<string, number> = {}
  for (const [category, scores] of Object.entries(categoryGroups)) {
    breakdown[category] = scores.reduce((a, b) => a + b, 0) / scores.length
  }

  return { competencyBreakdown: breakdown }
}
```

### 9.4 EmployeeReport Update (Upsert After Each Submission)

After every submission, upsert the `EmployeeReport`:

```ts
async function updateEmployeeReport(employeeId: string, newScore: number) {
  const allSubmissions = await prisma.assessmentSubmission.findMany({
    where: { employeeId },
    orderBy: { submittedAt: "asc" },
  })

  const scores = allSubmissions.map((s) => s.totalScore)
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const highestScore = Math.max(...scores)
  const lowestScore = Math.min(...scores)

  // Trend: compare latest 3 vs previous 3
  const trend = computeTrend(scores)

  await prisma.employeeReport.upsert({
    where: { employeeId },
    create: { employeeId, totalSubmissions: 1, latestScore: newScore, averageScore, highestScore, lowestScore, trend, lastAssessedAt: new Date() },
    update: { totalSubmissions: scores.length, latestScore: newScore, averageScore, highestScore, lowestScore, trend, lastAssessedAt: new Date() },
  })
}

function computeTrend(scores: number[]): string {
  if (scores.length < 3) return "stable"
  const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / 3
  const previous = scores.slice(-6, -3).reduce((a, b) => a + b, 0) / Math.max(scores.slice(-6, -3).length, 1)
  if (recent > previous + 0.3) return "improving"
  if (recent < previous - 0.3) return "declining"
  return "stable"
}
```

---

## 10. Remark System v0

The remark system converts a `totalScore` (0.0–5.0 float) into a human-readable remark label and an integer band (1–5).

### Score Bands

| Score Range | Remark Score (int) | Remark Label | Description |
|---|---|---|---|
| 0.0 – 1.0 | 1 | Critical Risk | Fundamental safety behaviors are absent or consistently unsafe. Immediate intervention required. |
| 1.1 – 2.0 | 2 | Needs Improvement | Awareness of safety protocols exists but application is inconsistent. Structured coaching needed. |
| 2.1 – 3.0 | 3 | Developing | Demonstrates basic safety compliance. Inconsistencies remain in proactive behaviors. |
| 3.1 – 4.0 | 4 | Satisfactory | Consistently applies safety behaviors. Shows ownership and proactive hazard identification. |
| 4.1 – 5.0 | 5 | Exemplary | Champions safety culture. Coaches peers, reports near-misses, and leads by example. |

### Implementation

```ts
// lib/scoring.ts

export function computeRemark(totalScore: number): { remarkScore: number; remark: string; description: string } {
  if (totalScore <= 1.0) return { remarkScore: 1, remark: "Critical Risk", description: "Fundamental safety behaviors are absent..." }
  if (totalScore <= 2.0) return { remarkScore: 2, remark: "Needs Improvement", description: "Awareness of safety protocols exists but..." }
  if (totalScore <= 3.0) return { remarkScore: 3, remark: "Developing", description: "Demonstrates basic safety compliance..." }
  if (totalScore <= 4.0) return { remarkScore: 4, remark: "Satisfactory", description: "Consistently applies safety behaviors..." }
  return { remarkScore: 5, remark: "Exemplary", description: "Champions safety culture..." }
}
```

### Remark Display

- Shown as a badge with color coding:
  - 1 → `red` (Critical Risk)
  - 2 → `orange` (Needs Improvement)
  - 3 → `yellow` (Developing)
  - 4 → `blue` (Satisfactory)
  - 5 → `green` (Exemplary)
- Shown on: submission confirmation, employee detail, employee report, admin tables.

---

## 11. Reporting & Export

### 11.1 Employee CSV Export

`GET /api/sub-admin/employees/[id]/export/csv`

Downloads a CSV of the employee's full assessment history:

```
Employee Name, Department, Job Role, Site, Assessment Date, Total Score, Remark Score,
Remark Label, HAZARD_RECOGNITION, INCIDENT_RESPONSE, COMPLIANCE_AWARENESS,
RISK_ASSESSMENT, BEHAVIORAL_ACCOUNTABILITY, Submitted By
```

### 11.2 Print-Ready Employee Report

Route: `/sub-admin/employees/[id]/report/print`

- Clean HTML page optimized for browser print (`@media print`).
- Shows: employee profile, all-time stats, assessment history table, trend summary.
- SuperAdmin can also access: `/super-admin/employees/[id]/report/print`.

### 11.3 SubAdmin Bulk Export (SuperAdmin only)

`GET /api/super-admin/export/csv?subAdminId=<optional>`

- If `subAdminId` provided: exports all employees + submissions for that SubAdmin.
- If omitted: exports everything platform-wide.

### 11.4 Full Report Generation
Deferred to Phase 2. "Generate Report" button is scaffolded but shows "Coming Soon."

---

## 12. API Routes

### SuperAdmin Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/super-admin/auth/login` | Login, set JWT cookie |
| POST | `/api/super-admin/auth/logout` | Clear JWT cookie |

### SuperAdmin — SubAdmins

| Method | Route | Description |
|---|---|---|
| GET | `/api/super-admin/sub-admins` | List all SubAdmins (paginated, filterable by status) |
| GET | `/api/super-admin/sub-admins/[id]` | SubAdmin detail |
| PATCH | `/api/super-admin/sub-admins/[id]/approve` | Approve SubAdmin |
| PATCH | `/api/super-admin/sub-admins/[id]/reject` | Reject SubAdmin |
| PATCH | `/api/super-admin/sub-admins/[id]/revoke` | Revoke approval |

### SuperAdmin — Employees & Reports

| Method | Route | Description |
|---|---|---|
| GET | `/api/super-admin/employees` | All employees platform-wide |
| GET | `/api/super-admin/employees/[id]` | Employee detail |
| GET | `/api/super-admin/employees/[id]/report` | Employee progress report |
| GET | `/api/super-admin/export/csv` | Platform-wide CSV export |

### SuperAdmin — Questions

| Method | Route | Description |
|---|---|---|
| GET | `/api/super-admin/questions` | List questions |
| POST | `/api/super-admin/questions` | Create question + options |
| PATCH | `/api/super-admin/questions/[id]` | Update question |
| DELETE | `/api/super-admin/questions/[id]` | Delete question |
| PATCH | `/api/super-admin/questions/[id]/toggle` | Activate/deactivate |

### SuperAdmin — Dashboard

| Method | Route | Description |
|---|---|---|
| GET | `/api/super-admin/dashboard/stats` | Platform-wide metrics |
| GET | `/api/super-admin/dashboard/leaderboard` | SubAdmin leaderboard |

### Better Auth (SubAdmin)

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/auth/[...all]` | Better Auth catch-all handler |

### SubAdmin — Employees

| Method | Route | Description |
|---|---|---|
| GET | `/api/sub-admin/employees` | Own employee list |
| POST | `/api/sub-admin/employees` | Register new employee |
| GET | `/api/sub-admin/employees/[id]` | Employee detail |
| PATCH | `/api/sub-admin/employees/[id]` | Update employee |
| GET | `/api/sub-admin/employees/[id]/report` | Employee progress report |
| GET | `/api/sub-admin/employees/[id]/export/csv` | CSV export |

### SubAdmin — Assessments

| Method | Route | Description |
|---|---|---|
| POST | `/api/sub-admin/assessments/start` | Start session, get 8 questions |
| GET | `/api/sub-admin/assessments/[sessionId]` | Resume in-progress session |
| POST | `/api/sub-admin/assessments/[sessionId]/submit` | Submit responses |

### SubAdmin — Dashboard

| Method | Route | Description |
|---|---|---|
| GET | `/api/sub-admin/dashboard/stats` | Own metrics |

---

## 13. Frontend Pages & Components

### 13.1 Page Map

```
/                                          → redirect to /login
/login                                     → SubAdmin Google SSO login
/super-admin/login                         → SuperAdmin username + password login

/sub-admin/pending                         → Locked dashboard (pending approval)
/sub-admin/rejected                        → Rejection notice
/sub-admin/dashboard                       → SubAdmin home (metrics + recent activity)
/sub-admin/employees                       → Employee list
/sub-admin/employees/[id]                  → Employee detail
/sub-admin/employees/[id]/assess           → Submit assessment form
/sub-admin/employees/[id]/report           → Employee progress report
/sub-admin/employees/[id]/report/print     → Print-ready report

/super-admin/dashboard                     → SuperAdmin home (platform metrics + leaderboard)
/super-admin/sub-admins                    → SubAdmin management
/super-admin/sub-admins/[id]               → SubAdmin detail
/super-admin/employees                     → All employees platform-wide
/super-admin/employees/[id]                → Employee detail (same as SubAdmin view)
/super-admin/employees/[id]/report         → Employee report
/super-admin/questions                     → Question bank management
```

### 13.2 Layout Structure

```
/app
  layout.tsx                               → Root layout (fonts, ThemeProvider)
  page.tsx                                 → Redirect to /login

  (auth)/
    login/page.tsx                         → SubAdmin login
    super-admin/login/page.tsx             → SuperAdmin login

  (sub-admin)/
    layout.tsx                             → SubAdmin shell (sidebar + approval guard banner)
    pending/page.tsx
    rejected/page.tsx
    dashboard/page.tsx
    employees/
      page.tsx
      [id]/
        page.tsx
        assess/page.tsx
        report/page.tsx
        report/print/page.tsx

  (super-admin)/
    layout.tsx                             → SuperAdmin shell (sidebar)
    dashboard/page.tsx
    sub-admins/
      page.tsx
      [id]/page.tsx
    employees/
      page.tsx
      [id]/page.tsx
      [id]/report/page.tsx
    questions/page.tsx

  api/
    auth/[...all]/route.ts                 → Better Auth handler
    super-admin/
      auth/login/route.ts
      auth/logout/route.ts
      sub-admins/[...]/route.ts
      employees/[...]/route.ts
      questions/[...]/route.ts
      dashboard/[...]/route.ts
      export/csv/route.ts
    sub-admin/
      employees/[...]/route.ts
      assessments/[...]/route.ts
      dashboard/stats/route.ts
```

### 13.3 Key Shared Components

| Component | Description |
|---|---|
| `RemarkBadge` | Color-coded badge for remark score 1–5 |
| `ScoreBadge` | Numeric score display (e.g. "3.8 / 5") |
| `TrendIndicator` | Arrow icon: ↑ improving / ↓ declining / → stable |
| `EmployeeTable` | Reusable data table for employee lists |
| `AssessmentForm` | Scrollable 8-question radio form |
| `QuestionBlock` | Single question + options (radio group) |
| `ProgressReportCard` | Summary card: score, remark, trend |
| `CompetencyBarChart` | Bar chart of per-category scores (recharts) |
| `ScoreTrendChart` | Line chart of score history over time (recharts) |
| `SubAdminLeaderboard` | Ranked leaderboard table |
| `ApprovalStatusBanner` | Top-of-page banner for pending SubAdmins |
| `StatCard` | Metric card (number + label + icon) |
| `ConfirmDialog` | shadcn AlertDialog for destructive actions |
| `QuestionFormModal` | Add/edit question drawer |
| `EmployeeFormModal` | Add/edit employee drawer |

### 13.4 Design System

- **Font:** Inter (Google Fonts via `next/font`)
- **Colors:** Neutral slate base + safety accent: `emerald-600` (good), `red-500` (danger), `amber-500` (warning), `blue-600` (info).
- **Remark colors:** red-500 (1), orange-500 (2), yellow-500 (3), blue-500 (4), emerald-500 (5).
- **Layout:** Collapsible sidebar for both admin types. Clean card-based content areas.
- **shadcn components used:** Button, Card, Table, Badge, Dialog, Drawer, Form, Input, Select, Textarea, Tabs, Separator, Skeleton, Toast, Avatar, DropdownMenu, Progress.
- **Charts:** recharts (LineChart for trends, BarChart for competency breakdown).
- **Responsive:** Mobile-first. Sidebar collapses to a bottom tab bar on mobile.
- **Dark mode:** Optional — Tailwind `dark:` classes + `ThemeProvider` toggle.

---

## 14. Question Bank & Seeding

### 14.1 questions.json Structure

Located at `/prisma/seed/questions.json`.

```json
[
  {
    "text": "You observe a coworker not wearing required PPE while operating machinery. What is your immediate response?",
    "category": "HAZARD_RECOGNITION",
    "difficulty": "MEDIUM",
    "options": [
      { "text": "Ignore it — it's their responsibility.", "score": 0.0, "weightLabel": "Never" },
      { "text": "Wait and hope a supervisor notices.", "score": 1.5, "weightLabel": "Rarely" },
      { "text": "Remind them verbally about the requirement.", "score": 3.5, "weightLabel": "Usually" },
      { "text": "Remind them immediately and log it as a near-miss observation.", "score": 5.0, "weightLabel": "Always" }
    ]
  }
]
```

> Options are scored on a 0.0–5.0 scale. `weightLabel` is displayed to the SubAdmin during the assessment.

### 14.2 Seed Script

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import questions from "./seed/questions.json"

const prisma = new PrismaClient()

async function main() {
  // Seed SuperAdmin
  const hash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD!, 12)
  await prisma.superAdmin.upsert({
    where: { username: process.env.ADMIN_USERNAME! },
    update: {},
    create: { username: process.env.ADMIN_USERNAME!, passwordHash: hash },
  })

  // Seed questions
  for (const q of questions) {
    await prisma.question.create({
      data: {
        text: q.text,
        category: q.category as any,
        difficulty: q.difficulty as any,
        options: { create: q.options },
      },
    })
  }

  console.log("Seed complete.")
}

main()
```

Run: `npx prisma db seed`

---

## 15. Environment & Configuration

```env
# .env

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/swapout"

# Better Auth (SubAdmin SSO)
BETTER_AUTH_SECRET="<random-32-char-string>"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (for SubAdmin)
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"

# SuperAdmin JWT
JWT_SECRET="<random-64-char-string>"

# SuperAdmin seed credentials
ADMIN_USERNAME="superadmin"
ADMIN_INITIAL_PASSWORD="<strong-password>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 16. Security Considerations

| Concern | Mitigation |
|---|---|
| SuperAdmin JWT exposure | `httpOnly; Secure; SameSite=Strict` cookie. 8h expiry. |
| Unapproved SubAdmin accessing data | `requireSubAdmin()` checks `approvalStatus === APPROVED` server-side on every route. |
| SubAdmin accessing another SubAdmin's employees | Every employee query filters by `subAdminId` from authenticated session. |
| Double-submitting an assessment | Session `status` checked before submission; `COMPLETED` sessions cannot be re-submitted. |
| CSRF | SameSite cookies + Next.js App Router CSRF protection. |
| SQL injection | Prisma parameterized queries — zero raw SQL. |
| Session fixation | Better Auth handles session rotation on login. |
| Secrets in codebase | All secrets in `.env`, `.gitignore`d. Provide `.env.example`. |
| SuperAdmin account brute force | Rate-limit `/api/super-admin/auth/login` (5 attempts / 15 min via middleware counter). |

---

## 17. Project File Structure

```
swapout/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── super-admin/login/page.tsx
│   ├── (sub-admin)/
│   │   ├── layout.tsx
│   │   ├── pending/page.tsx
│   │   ├── rejected/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── employees/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── assess/page.tsx
│   │           └── report/
│   │               ├── page.tsx
│   │               └── print/page.tsx
│   ├── (super-admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── sub-admins/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── report/page.tsx
│   │   └── questions/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── super-admin/
│   │   │   ├── auth/
│   │   │   ├── sub-admins/
│   │   │   ├── employees/
│   │   │   ├── questions/
│   │   │   ├── dashboard/
│   │   │   └── export/
│   │   └── sub-admin/
│   │       ├── employees/
│   │       ├── assessments/
│   │       └── dashboard/
│   ├── layout.tsx
│   └── page.tsx                          → redirect to /login
├── components/
│   ├── ui/                               → shadcn auto-generated
│   ├── remark-badge.tsx
│   ├── score-badge.tsx
│   ├── trend-indicator.tsx
│   ├── employee-table.tsx
│   ├── assessment-form.tsx
│   ├── question-block.tsx
│   ├── progress-report-card.tsx
│   ├── competency-bar-chart.tsx
│   ├── score-trend-chart.tsx
│   ├── sub-admin-leaderboard.tsx
│   ├── approval-status-banner.tsx
│   ├── stat-card.tsx
│   ├── confirm-dialog.tsx
│   ├── question-form-modal.tsx
│   ├── employee-form-modal.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── auth.ts                           → Better Auth config
│   ├── prisma.ts                         → Prisma client singleton
│   ├── super-admin-auth.ts               → requireSuperAdmin() + JWT helpers
│   ├── sub-admin-auth.ts                 → requireSubAdmin() + approval check
│   ├── scoring.ts                        → computeRemark, computeCompetencyBreakdown, computeTrend
│   └── export.ts                         → CSV generation helpers
├── middleware.ts                         → Route protection
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed/
│       └── questions.json
├── .env
├── .env.example
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 18. Phase Roadmap

### Phase 1 — Current Scope (this specification)
- [x] SuperAdmin JWT auth (username + password)
- [x] SubAdmin Google SSO (Better Auth) with approval gate
- [x] Pending / Rejected / Approved SubAdmin states
- [x] SuperAdmin dashboard: platform metrics + SubAdmin leaderboard
- [x] SuperAdmin: approve / reject / revoke SubAdmins
- [x] SuperAdmin: view all SubAdmin details and their employees
- [x] SuperAdmin: view all employees platform-wide
- [x] SuperAdmin: question bank CRUD
- [x] SubAdmin: register employees (form: name, department, role, phone, site)
- [x] SubAdmin: edit employees
- [x] SubAdmin: submit assessments on employee behalf (8 random questions)
- [x] SubAdmin: view employee progress report
- [x] Remark system v0 (5-band: Critical Risk → Exemplary)
- [x] Score computation (0.0–5.0 average, per-category breakdown)
- [x] EmployeeReport upsert with trend computation after each submission
- [x] CSV export (per employee + platform-wide)
- [x] Print-ready report
- [x] Mobile-responsive UI

### Phase 2 — Deferred
- [ ] Full AI/rule-based recommendation engine per remark band
- [ ] Radar chart for competency breakdown
- [ ] Rich narrative report generation (PDF via Puppeteer/headless)
- [ ] Email notifications (SubAdmin approval, assessment completion)
- [ ] SuperAdmin platform-wide analytics (charts over time)
- [ ] Employee photo/ID field
- [ ] Question difficulty weighting in score computation
- [ ] Multi-language support

---

## 19. Open / Deferred Items

| Item | Status | Notes |
|---|---|---|
| `questions.json` content | Needs population | 100+ questions across 5 competency categories, 3 difficulty levels. Score each option 0.0–5.0. |
| SubAdmin leaderboard composite score formula | Needs sign-off | Current formula: `(assessmentsSubmitted * 0.5) + (employeesEnrolled * 0.3) + (consistencyScore * 0.2)`. Adjust weights as needed. |
| Google OAuth credentials | Needs setup | Create Google Cloud project, enable OAuth 2.0, add `http://localhost:3000/api/auth/callback/google` as redirect URI. |
| Deployment target | TBD | Recommended: Vercel + Neon (managed PostgreSQL). |
| `AssessmentSessionQuestion` model alignment with Better Auth | Verify | Better Auth expects `User`, `Session`, `Account`, `Verification` table names. The schema above uses `SubAdmin` — confirm Better Auth adapter supports a custom user table name, or rename to `User` with a `role` field instead. |
| Rate limiting on SuperAdmin login | Phase 1 / low effort | Implement simple in-memory counter or use `upstash/ratelimit` if deploying to Vercel Edge. |
```₹