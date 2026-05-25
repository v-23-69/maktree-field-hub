# Staging Deployment Summary — 2026-05-26

## Supabase branch status

**Supabase Preview Branch:** Not created — organization requires **Pro plan** for branching (`PaymentRequiredException`).

Migrations were applied to the linked project `limgkjuywvudkxnantda` via MCP with pre/post SQL verification. This is the same database the app uses in `.env` (treat as **pre-production validation DB** until a dedicated staging project exists).

## Applied migrations (execution order)

| # | Local file | MCP registered name | Result |
|---|------------|---------------------|--------|
| 1 | `20260526120000_rls_initplan_daily_reports_doctors.sql` | `rls_initplan_daily_reports_doctors` (v20260525184451) | **Skipped** — already applied |
| 2 | `20260526140000_rls_initplan_expense_leave.sql` | `rls_initplan_expense_leave` | ✅ Success |
| 3 | `20260526150000_fk_indexes_safe.sql` (corrected) | `fk_indexes_safe` | ✅ Success (after schema fix) |
| 4 | `20260526130000_p0a_*.sql` | `p0a_analytics_views_select_only_grants` | ✅ Success |
| 5 | `20260526130100_p0b_*.sql` | `p0b_analytics_views_security_invoker` | ✅ Success |

## Post-migration SQL checks

- `v_dcr_daily_status` grants: **SELECT only** for `anon` + `authenticated`
- Security invoker: `v_dcr_daily_status`, `v_target_achievement`, `v_master_list_completion` → `security_invoker=true`
- Indexes created: `idx_expense_items_report_id`, `idx_report_visits_report_id`, `idx_leave_requests_mr_id`, `idx_leave_requests_manager_id`, `idx_tour_program_entries_program_date`
- Analytics views return rows (service-role SQL probe)

## Rollback files verified

- `20260526140100_rollback_rls_initplan_expense_leave.sql`
- `20260526150100_rollback_fk_indexes_safe.sql`
- `20260526130200_p0a_rollback_*.sql`
- `20260526130300_p0b_rollback_*.sql`

## Git / deploy

- **Branch:** `feat/enterprise-optimization-staging`
- **NOT merged** to `main`
- **Vercel production:** NOT promoted

## Manual validation still required

Role-based UI smoke tests (MR / manager / admin) on preview URL with real accounts.
