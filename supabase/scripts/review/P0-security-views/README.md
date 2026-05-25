# P0 — Analytics views security (REVIEW ONLY)

**Status:** Not applied to production. Smoke-test P1 frontend/realtime first.

## Contents

| File | Purpose |
|------|---------|
| `01_forward_migration.sql` | Proposed DDL (invoker + SELECT-only grants) |
| `02_rollback_migration.sql` | Reverts to current production behavior |
| `03_validation_checklist.md` | MR / manager / admin test matrix |

## Summary

### Views requiring `security_invoker` (currently definer)

1. `v_dcr_daily_status`
2. `v_dcr_monthly_summary`
3. `v_doctor_last_visit`
4. `v_expense_by_category`
5. `v_expense_monthly_summary`
6. `v_master_list_completion`
7. `v_target_achievement`
8. `v_tour_plan_vs_actual`
9. `v_visit_detail`

### Views already `security_invoker=true` (grant-only change)

1. `v_area_performance`
2. `v_competitor_intelligence`
3. `v_competitor_summary`
4. `v_doctor_loyalty`
5. `v_monthly_support_summary`

### Grant change (all 14 views)

Revoke `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `TRIGGER`, `REFERENCES` from `anon` and `authenticated`.  
Grant/retain **`SELECT` only** (app never writes to views).

## Recommended apply order

1. **P0a** — Grant tightening only (`01_forward_migration.sql` section A). Low risk.
2. **P0b** — Recreate 9 definer views with invoker (`01_forward_migration.sql` section B). Test checklist.
3. If regression: run `02_rollback_migration.sql` (or P0b rollback only).

## App touchpoints

| View | Used by |
|------|---------|
| `v_dcr_daily_status` | MR Dashboard |
| `v_master_list_completion` | MR Master List |
| `v_visit_detail` | Manager Analytics |
| `v_monthly_support_summary`, `v_competitor_summary` | Manager Analytics |
| `v_expense_monthly_summary`, `v_expense_by_category` | Manager Analytics |
| `v_target_achievement` | MR/Manager Targets hooks |
