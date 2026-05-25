# P0 Analytics Views — Permission Matrix (Before / After)

**Status:** Migrations prepared locally only — **NOT applied to production** until explicit approval.

| View | Before (anon/authenticated) | After P0a | After P0b (invoker) |
|------|------------------------------|-----------|---------------------|
| v_area_performance | ALL + SELECT | SELECT only | RLS of underlying tables |
| v_competitor_intelligence | ALL + SELECT | SELECT only | RLS |
| v_competitor_summary | ALL + SELECT | SELECT only | RLS |
| v_dcr_daily_status | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_dcr_monthly_summary | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_doctor_last_visit | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_doctor_loyalty | ALL + SELECT | SELECT only | RLS |
| v_expense_by_category | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_expense_monthly_summary | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_master_list_completion | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_monthly_support_summary | ALL + SELECT | SELECT only | RLS |
| v_target_achievement | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_tour_plan_vs_actual | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |
| v_visit_detail | ALL + SELECT (DEFINER) | SELECT only | security_invoker=true |

## Affected roles

| Role | Expected change |
|------|-----------------|
| anon | Cannot INSERT/UPDATE/DELETE/TRUNCATE views (already unused in app) |
| authenticated (MR) | Same SELECT visibility; rows filtered by RLS after P0b |
| authenticated (manager) | Team-scoped analytics unchanged if RLS policies correct |
| authenticated (admin) | Full analytics visibility preserved |
| service_role | Unchanged (bypasses RLS) |

## Row visibility (P0b)

With `security_invoker = true`, view results respect the **caller's** RLS on base tables. Users who previously saw rows via DEFINER bypass may see **fewer** rows if policies are stricter — validate MR/manager/admin dashboards before production apply.

## Rollback

| Step | File |
|------|------|
| Undo invoker | `20260526130300_p0b_rollback_analytics_views_security_invoker.sql` |
| Undo grants | `20260526130200_p0a_rollback_analytics_views_grants.sql` |

## Validation checklist

- [ ] MR dashboard (`v_dcr_daily_status`, targets, TP)
- [ ] Manager analytics & team hub
- [ ] Admin dashboard
- [ ] DCR reports & exports
- [ ] Expense summaries
- [ ] Master list completion view
- [ ] Tour plan vs actual
