# P0 — Affected views, grants, and permission behavior

Production snapshot: **2026-05-26** (project `limgkjuywvudkxnantda`).

---

## 1. View inventory

| View | `security_invoker` today | P0b change | Primary app consumer |
|------|-------------------------|------------|----------------------|
| `v_dcr_daily_status` | **null (definer)** | SET invoker | MR Dashboard (`v_dcr_daily_status`) |
| `v_dcr_monthly_summary` | **null** | SET invoker | (reserved / reporting) |
| `v_doctor_last_visit` | **null** | SET invoker | (analytics / alerts pipeline) |
| `v_expense_by_category` | **null** | SET invoker | Manager Analytics |
| `v_expense_monthly_summary` | **null** | SET invoker | Manager Analytics |
| `v_master_list_completion` | **null** | SET invoker | MR Master List |
| `v_target_achievement` | **null** | SET invoker | `useTargets` |
| `v_tour_plan_vs_actual` | **null** | SET invoker | (TP compliance reporting) |
| `v_visit_detail` | **null** | SET invoker | `useManagerAnalytics` |
| `v_area_performance` | true | none (P0a grants only) | Manager Analytics |
| `v_competitor_intelligence` | true | none | Manager Analytics |
| `v_competitor_summary` | true | none | Manager Analytics |
| `v_doctor_loyalty` | true | none | Manager Analytics |
| `v_monthly_support_summary` | true | none | Manager Analytics |

---

## 2. Grants — before vs after

### Before (current production)

| Grantee | Privileges on each `v_*` view |
|---------|-------------------------------|
| `anon` | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
| `authenticated` | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |

The app uses **SELECT only**. Write grants on views are unnecessary and widen attack surface (especially under definer views).

### After P0a (proposed)

| Grantee | Privileges |
|---------|------------|
| `anon` | **SELECT** only |
| `authenticated` | **SELECT** only |

### Expected permission behavior change (P0a)

| Operation | Before | After |
|-----------|--------|-------|
| Client `.from('v_visit_detail').select()` | Allowed | Allowed |
| Client `.insert()` / `.update()` / `.delete()` on view | Allowed by grant (unusual) | **Denied** |
| Service role direct SQL | Unchanged | Unchanged |

---

## 3. security_invoker — semantic change (P0b)

### Definer (current) on 9 views

- View runs with **owner** privileges.
- **RLS on underlying tables is bypassed** for the view query.
- Any role with `SELECT` on the view may see **aggregated rows across all MRs** that the view SQL joins, regardless of team mapping.

### Invoker (proposed)

- View runs with **caller's** privileges.
- **RLS applies** to `users`, `daily_reports`, `doctors`, `report_visits`, etc.
- Result sets become **tenant-scoped** by existing policies.

### Per-role expected changes

| Role | View | Before (definer) | After (invoker) |
|------|------|------------------|-----------------|
| **MR** | `v_dcr_daily_status` | Could theoretically see all MR rows in view | **Own MR row** (app filters `mr_id`; RLS on `users` limits base rows) |
| **MR** | `v_master_list_completion` | All MRs’ completion in view SQL | **Own `mr_id`** rows only |
| **MR** | `v_visit_detail` | All submitted visits in view | Only visits for reports MR can read via `daily_reports` RLS |
| **MR** | `v_target_achievement` | All targets in view | **Own targets** via `targets` RLS |
| **Manager** | `v_visit_detail` | All team/company visits in view | **Team MRs + self** per `daily_reports` / `mr_manager_map` policies |
| **Manager** | `v_expense_*` | All MR expenses in view | **Mapped MRs** per expense RLS |
| **Manager** | `v_dcr_daily_status` | All active MR status rows | MR + manager users per `users_manager_select` (not unmapped MRs’ underlying report data) |
| **Admin** | Analytics views | Broad aggregates | Scoped by admin policies on base tables when using views; prefer admin table/RPC paths |

**Important:** Row count **decrease** after P0b usually means the security fix is working, not broken analytics.

---

## 4. Underlying RLS dependencies (for validation)

Invoker views inherit enforcement from:

| Table | MR | Manager | Admin |
|-------|-----|---------|-------|
| `users` | own row SELECT | MR+manager role SELECT | JWT admin ALL |
| `daily_reports` | own + policies | team via `mr_manager_map` | admin policy |
| `doctors` | territory access | team territory UPDATE | admin/manager write |
| `expense_reports` | scoped SELECT | team SELECT | admin |

---

## 5. Why `ALTER VIEW … SET (security_invoker)` (not DROP/CREATE)

- Preserves view definitions exactly (no CASCADE / column reorder risk).
- Reversible via `RESET (security_invoker)`.
- Zero app deployment dependency.

---

## 6. Files to apply (when approved)

1. `01_forward_migration.sql` — P0a then P0b
2. `02_rollback_migration.sql` — reverse order: P0b then P0a
3. `03_validation_checklist.md` — role-based QA

Do **not** apply until frontend/realtime smoke tests pass.
