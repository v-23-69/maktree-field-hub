# P0 validation checklist — MR, Manager, Admin

Run after **P0a** (grants) and again after **P0b** (security_invoker).  
Use staging or a Supabase branch when possible. Compare row counts to pre-migration only as a guide — **fewer rows after P0b is often correct**.

## Pre-flight

- [ ] Snapshot: `pg_policies` for `daily_reports`, `doctors`, `users`
- [ ] Export view `reloptions` and grants (scripts in `01_forward_migration.sql` comments)
- [ ] Note test accounts: 1 MR, 1 manager (with ≥2 MRs), 1 admin

---

## P0a — Grants only (SELECT on views)

| Role | Screen | Action | Expected |
|------|--------|--------|----------|
| MR | Master List | Open completion view | Loads as before |
| MR | Dashboard | DCR daily status card | Loads as before |
| Manager | Analytics | Run report / all tabs | Loads as before |
| Manager | Analytics | Expense overview queries | Loads as before |
| Admin | — | No direct view-only admin screens | N/A |

**Negative (SQL editor as authenticated):**

- [ ] `INSERT INTO v_visit_detail (...) VALUES (...)` → **permission denied** (expected)

---

## P0b — security_invoker on 9 views

### MR

| # | Screen | Steps | Pass criteria |
|---|--------|-------|----------------|
| M1 | Login | Sign in as MR | Success |
| M2 | Dashboard | Open dashboard | `v_dcr_daily_status` row for **own** `mr_id` only; TP/DCR/expense flags sane |
| M3 | Dashboard | Holiday / non-working day | `is_working_day` matches expectations |
| M4 | Master List | Open list | Completion rows only for **own** territories |
| M5 | Master List | Filter sub-area | Doctors load; edit one doctor | Save succeeds |
| M6 | New Report | Submit field DCR | Succeeds; dashboard updates |
| M7 | Targets | Open targets (if assigned) | `v_target_achievement` shows **own** targets only |
| M8 | Report History | Open submitted report | Detail loads |
| M9 | PDF export | Download DCR PDF | PDF generates (P1 dynamic import) |

**MR must NOT see:** Other MRs’ DCR status rows, other MRs’ master-list completion, other MRs’ visit detail in analytics.

### Manager

| # | Screen | Steps | Pass criteria |
|---|--------|-------|----------------|
| G1 | Login | Sign in as manager | Success |
| G2 | Dashboard | Team stats / today | Team activity scoped to mapped MRs |
| G3 | Analytics | Overview tab, date range | Charts render; visit counts > 0 if team has data |
| G4 | Analytics | Filter by team MR set | Data limited to team (not all company MRs) |
| G5 | Analytics | Calls / speciality tab | Pie chart loads (lazy recharts) |
| G6 | Analytics | Area / loyalty / intel tabs | Data or empty state; no 403 |
| G7 | Reports | View MR report + PDF | Loads; PDF export works |
| G8 | Team Hub | MR detail → Analytics tab | Scoped to that MR |
| G9 | Unlock / leaves | Pending lists | Unchanged |

**Manager must NOT see:** Unmapped MRs’ submitted DCRs in `v_visit_detail` / analytics aggregates.

### Admin

| # | Screen | Steps | Pass criteria |
|---|--------|-------|----------------|
| A1 | Login | Sign in as admin | Success |
| A2 | Users / Doctors / Areas | CRUD smoke test | Unchanged |
| A3 | Admin dashboard | Stats cards | Counts load |
| A4 | Targets | Set/view targets | `v_target_achievement` acceptable for admin scope |

**Note:** Admin JWT policies on `users` use `app_metadata.role`. Views with invoker still respect base-table RLS; admin often uses tables/RPCs directly — confirm no new empty analytics if admin uses manager-style views later.

---

## Regression signals (stop and rollback P0b)

- Empty analytics for manager with known team activity
- MR dashboard missing own DCR status row
- 403 on view `select` that worked pre-P0b
- Master list completion always zero with doctors present

**Rollback:** `02_rollback_migration.sql` Section B only first; if grants issue, Section A too.

---

## Realtime smoke (P1 — your current test pass)

- [ ] Manager dashboard open; another user submits DCR → only report-related cards refresh
- [ ] Birthday wish → only birthday queries invalidate
- [ ] Tab focus → full dashboard refresh still works
