# BBS Assessment Application
## Product Specification v1.0 | HSE / Behavioral-Based Safety Platform | ISO 45001 aligned

## 1. Overview
A web and mobile application that assesses the behavioral safety maturity of individuals and teams using interactive, scenario-based questions. Results are surfaced through an analytics dashboard providing scores, gap analysis, root causes, recommendations, success metrics, and real-world implementation examples. All assessment data is persisted in the backend and retrievable at any time by an admin.

## 2. Goals
| Goal | Description |
|---|---|
| Behavioral insight | Measure individual and team safety behavior against ISO 45001 competency standards |
| Actionable output | Surface specific gaps, root causes, and targeted interventions — not generic advice |
| Scalability | Start with 10–15 users; architecture supports growth across sites and departments |
| Data integrity | Full audit trail with admin-controlled user management and data retrieval |

## 3. User roles
| Role | Focus area | Primary scenarios |
|---|---|---|
| Frontline worker | Day-to-day hazard awareness, PPE compliance | 60% hazard recognition, 40% compliance |
| Supervisor | Near-miss reporting, team safety culture | 50% incident management, 50% leadership behavior |
| Site in charge | Site-level risk management, permit systems | 50% risk assessment, 50% system safety |
| Engineer | Design safety, technical risk assessment | 40% design/system safety, 60% technical compliance |
| Safety professional | BBS methodology, audit and coaching | 40% audit, 30% behavioral analysis, 30% coaching |

## 4. Assessment engine

### 4.1 Question bank
The backend maintains hundreds of scenario-based questions, tagged by role, competency category, and difficulty level. No question is a simple right/wrong binary — each has a weighted response set reflecting behavioral maturity.

### 4.2 Session structure
| Parameter | Value |
|---|---|
| Questions per session | 5–7 (randomized from role-specific pool) |
| Question format | Short scenario with 3–4 response options |
| Randomization | Pulled from role-tagged subset of full question bank |
| Anti-gaming | No two sessions serve identical question sets |

### 4.3 Behavioral maturity scoring
| Level | Label | Description | Score range |
|---|---|---|---|
| 1 | Awareness | Recognizes hazards but does not act consistently | 0–3 |
| 2 | Compliance | Follows rules when observed or reminded | 3–5 |
| 3 | Ownership | Proactively addresses safety without prompting | 5–8 |
| 4 | Advocacy | Champions safety culture; coaches peers | 8–10 |

## 5. Competency categories (ISO 45001)
| Category | Description |
|---|---|
| Hazard recognition | Ability to identify physical and behavioral hazards on site |
| Incident response | Near-miss reporting, escalation, first-response behavior |
| Compliance awareness | Knowledge and application of site and regulatory requirements |
| Risk assessment | Judgment on likelihood/severity and control selection |
| Behavioral accountability | Peer intervention, leadership behavior, culture contribution |

## 6. Dashboard

### 6.1 Individual view
| Section | Content |
|---|---|
| Overall BBS score | Score out of 10 with maturity level label |
| Competency breakdown | Score per category, visualized as radar or bar chart |
| Gap highlights | Top 2–3 weakest behavioral areas, auto-mapped to category |
| Root cause analysis | Likely underlying drivers of behavioral gaps |
| Recommendations | Targeted interventions: training, coaching, mentoring, site walk |
| Success metrics | Measurable targets aligned to ISO 45001 |
| Implementation examples | Real-world scenarios showing the gap in action and the corrected behavior |
| Assessment history | Timeline of past scores with trend line |

### 6.2 Team / site view (admin)
Aggregated behavioral trends across all users. Filterable by role, date range, competency category, and score band. Exportable for compliance reporting.

## 7. Admin panel
| Function | Description |
|---|---|
| User management | Add, remove, or deactivate users; assign roles |
| Data modification | Edit or delete individual assessment records |
| Full data access | Retrieve any user's complete assessment history at any time |
| Question bank management | Add, edit, deactivate questions; review randomization pools |
| Reporting | Generate team-level behavioral reports by date, role, or site |

## 8. Technical requirements
| Area | Requirement |
|---|---|
| Platforms | Web (desktop browser) + native/PWA mobile (on-site use) |
| Backend | Persistent database storing all responses, scores, and audit trails |
| Standards | ISO 45001 competency framework (baseline); site-specific calibration in Phase 2 |
| Security | Role-based access control; admin is sole data gatekeeper |
| Retrieval | Any assessment record retrievable at any given moment via admin panel |

## 9. Rollout plan
| Phase | Scope | Goal |
|---|---|---|
| Phase 1 — Pilot | Safety professionals + site in charge only (5–8 users) | Stress-test question logic, scoring nuance, and dashboard UX |
| Phase 2 — Expansion | Supervisors + engineers (up to 15 users) | Validate role-differentiated question sets and team-level trends |
| Phase 3 — Full rollout | All five roles across site | Site-specific metric calibration and comparative behavioral benchmarking |

## 10. Open items for next session
- Wireframes: assessment flow (mobile-first) and dashboard layout
- Question bank: sample scenario set for each role (10 per role to validate tone and difficulty)
- Scoring engine: weighting matrix per competency category per role
- Recommendation engine: intervention library mapped to gap types
- Tech stack selection: frontend framework, backend/database, mobile approach
-