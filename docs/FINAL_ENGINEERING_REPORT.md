# MakTree Field Hub — Enterprise Optimization Final Engineering Report

**Date:** 2026-05-26  
**Status:** Implementation complete on branch/working tree — **NOT deployed to production**  
**Supabase project:** `limgkjuywvudkxnantda` (ap-southeast-2)

---

## Executive summary

All planned optimization phases were implemented incrementally with reversibility, preserved business logic, and no production push/deploy. Frontend bundle splitting (P1), scalable pagination, virtualization, selective column queries, database migration artifacts (P0 security, RLS initplan, FK indexes), and observability hooks are ready for **staging validation** before approval.

---

## 1. Implemented optimizations

| Phase | Scope | Status |
|-------|--------|--------|
| P1 (prior) | Lazy recharts, dynamic PDF, targeted realtime invalidation | ✅ Built |
| Phase 1 | P0 security migrations (local files only) | ✅ Prepared, not applied |
| Phase 2 | Server-side pagination (admin doctors, MR master list) | ✅ |
| Phase 3 | Virtualized lists (`@tanstack/react-virtual`) | ✅ Admin doctors |
| Phase 4 | Hot-path `select('*')` cleanup | ✅ Partial (high-traffic hooks/views) |
| Phase 5 | RLS initplan (expense/leave), safe FK indexes | ✅ Migration files |
| Phase 6 | Sentry (env-gated), route error boundaries | ✅ |
| Phase 7 | Build/typecheck/tests | ✅ Build + tests; lint pre-existing errors |

---

## 2. Security improvements

### P0a — Analytics view grants (SELECT only)

**Migration:** `20260526130000_p0a_analytics_views_select_only_grants.sql`  
**Rollback:** `20260526130200_p0a_rollback_analytics_views_grants.sql`

Revokes INSERT/UPDATE/DELETE/TRUNCATE on 14 `v_*` views from `anon`/`authenticated`; grants SELECT only.

### P0b — Security invoker on 9 DEFINER views

**Migration:** `20260526130100_p0b_analytics_views_security_invoker.sql`  
**Rollback:** `20260526130300_p0b_rollback_analytics_views_security_invoker.sql`

Views: `v_dcr_daily_status`, `v_dcr_monthly_summary`, `v_doctor_last_visit`, `v_expense_by_category`, `v_expense_monthly_summary`, `v_master_list_completion`, `v_target_achievement`, `v_tour_plan_vs_actual`, `v_visit_detail`.

### Permission matrix

See `supabase/scripts/review/P0-security-views/04_permission_matrix_before_after.md`.

### Prior production note

`20260526120000_rls_initplan_daily_reports_doctors.sql` may already be on production from earlier session — verify before re-applying.

---

## 3. Frontend performance

| Change | Effect |
|--------|--------|
| Lazy `recharts` + manual chunk | Analytics route ~10.6 KB → ~3.7 KB gzip (route shell) |
| Dynamic `dcrPdf` import | PDF ~394 KB off critical path |
| Targeted realtime invalidation | Fewer refetches on unrelated table changes |
| Explicit column selects | Smaller API payloads on profile, expense, targets, DCR status |
| Server pagination | Admin doctors: 50/page; MR master: 80/page + load more |

### Production build (2026-05-26)

- **Result:** `tsc --noEmit && vite build` — **PASS** (~20s)
- **Notable chunks (gzip):** `vendor-recharts` 108 KB, `dcrPdf` 130 KB (lazy), main index ~60 KB, MR Dashboard ~8 KB

---

## 4. Database improvements

| Migration | Purpose | Applied? |
|-----------|---------|----------|
| `20260526120000_rls_initplan_daily_reports_doctors.sql` | Initplan on daily_reports + doctors | Verify prod |
| `20260526140000_rls_initplan_expense_leave.sql` | Initplan expense_reports + leave_requests | **Local only** |
| `20260526140100_rollback_rls_initplan_expense_leave.sql` | Rollback | — |
| `20260526150000_fk_indexes_safe.sql` | FK-support indexes (IF NOT EXISTS) | **Local only** |
| `20260526150100_rollback_fk_indexes_safe.sql` | Drop indexes | — |
| P0a / P0b | Grants + security_invoker | **Local only** |

**Indexes added (safe):** `expense_items(expense_report_id)`, `daily_report_items(daily_report_id)`, `leave_requests(mr_id)`, `leave_requests(manager_id)`, `tour_program_entries(mr_id, entry_date)`.

**Not done (by design):** Dropping duplicate/unused indexes without production `pg_stat_user_indexes` verification; aggressive RLS policy merges.

---

## 5. Scalability improvements

| Surface | Before | After |
|---------|--------|-------|
| Admin doctors | Full table fetch | `.range()` + `count: 'exact'`, filters, debounced search |
| MR master list doctors | All rows per sub-area | Paginated fetch + "Load more" |
| Admin doctors UI | Full DOM list | `VirtualizedScrollList` (page-sized, smooth scroll) |

### Row count scaling (expected)

| Doctors / area | Before (payload) | After (per request) |
|----------------|------------------|---------------------|
| 200 | ~200 rows × full row | 80 rows × explicit columns |
| 2,000 | Timeout risk / large JSON | 25 requests × 80 rows (load more) |
| 10,000+ admin | Browser/memory pressure | 50 rows/page + virtualization |

### Query timing (qualitative)

- **List endpoints:** O(page size) vs O(total rows)
- **RLS initplan:** Reduces per-row policy re-evaluation on large scans
- **FK indexes:** Faster joins on expense items, report items, leave filters

---

## 6. Bundle size comparisons

See P1 build metrics above. New shared chunks: `doctorQueryColumns`, `queryColumns` (<1 KB gzip each).

---

## 7. Query / payload comparisons

| Hook / page | Change |
|-------------|--------|
| `useProfile` | `USER_PROFILE_COLUMNS` (~20 fields vs `*`) |
| `useExpense` | `EXPENSE_REPORT_COLUMNS`, `EXPENSE_ITEM_COLUMNS`, view columns |
| `useTargets` | `TARGET_*`, `TARGET_ACHIEVEMENT_COLUMNS` |
| `useAdminDoctors` / paginated hooks | `DOCTOR_LIST_*` |
| `useMasterList` | View + doctor detail explicit columns |
| MR Dashboard | `v_dcr_daily_status` explicit columns |
| Manager Analytics | Expense view explicit columns |

**Remaining `select('*')`:** `useTourProgram`, `useLeaves`, `useAdminUsers`, `useManagerTeam`, `useReport` (detail), `useProducts`, etc. — documented as Phase 4 backlog.

---

## 8. Remaining technical debt

1. Apply P0 migrations on **staging branch** and run role matrix validation.
2. Extend server pagination to manager reports / admin users if row counts grow.
3. Virtualize MR master list doctor rows (optional; load-more may suffice for 80/page).
4. Complete `select('*')` on `useTourProgram`, `useLeaves`, `useReport`.
5. RLS initplan for remaining tables (`expense_items` policies if any use bare `auth.uid()`).
6. Lint: 11 pre-existing ESLint errors (not introduced by this pass).
7. Expand Vitest beyond placeholder test.
8. Baramati/chunk SQL files in git status — **do not apply** to production.

---

## 9. Future scaling recommendations

1. **Supabase read replicas** or materialized aggregates for manager analytics at 50+ MRs.
2. **Cursor-based pagination** if offset pagination slows beyond ~10k rows.
3. **Edge caching** only for static reference data (products, holidays) with explicit invalidation.
4. **P0b smoke test** on staging with real MR/manager/admin accounts before prod.
5. **Sentry** release tracking + performance transactions at 5–10% sample in prod.

---

## 10. Risk analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| P0b fewer rows visible (invoker + RLS) | High | Staging validation per role |
| Pagination breaks filters | Medium | Preserved filter/query keys; manual QA |
| Load-more stale state on sub-area change | Low | Reset `doctorPage` + `doctors` on change |
| FK index migration on large tables | Low | `IF NOT EXISTS`, online in Postgres |
| Sentry PHI leak | Medium | `beforeSend` + filtered context keys |

---

## 11. Rollback readiness

| Change type | Rollback |
|-------------|----------|
| P0a grants | `20260526130200_p0a_rollback_*.sql` |
| P0b invoker | `20260526130300_p0b_rollback_*.sql` |
| Expense/leave initplan | `20260526140100_rollback_*.sql` |
| FK indexes | `20260526150100_rollback_*.sql` |
| Frontend | `git revert` commit(s) — no schema coupling |

---

## 12. Production deployment checklist

- [ ] Create Supabase **branch** or staging project
- [ ] Apply migrations in order (initplan → FK → P0a → P0b)
- [ ] Run `03_validation_checklist.md` (MR, manager, admin)
- [ ] Smoke: DCR, TP, expense, PDF export, dashboards, realtime
- [ ] Deploy frontend to **preview** (Vercel)
- [ ] Set `VITE_SENTRY_DSN` in prod env (optional)
- [ ] Monitor errors 24h on staging
- [ ] **Explicit approval** before prod DB + prod deploy

---

## 13. Estimated scalability capacity

| Metric | Before (est.) | After (est.) |
|--------|---------------|--------------|
| Admin doctors list | ~2–5k rows comfortable | 50k+ with pagination |
| MR doctors per area | ~500 before UI lag | 5k+ with paging |
| Dashboard realtime churn | Full query invalidation | Targeted prefixes |
| Analytics view security | DEFINER bypass | Invoker + RLS aligned |

---

## 14. Files / modules changed

### Frontend (new/updated)

- `src/lib/doctorQueryColumns.ts`, `src/lib/queryColumns.ts`, `src/lib/observability.ts`
- `src/hooks/useAdminDoctorsPaginated.ts`, `src/hooks/useMrDoctorsPaginated.ts`
- `src/components/shared/VirtualizedScrollList.tsx`, `RouteErrorBoundary.tsx`
- `src/components/shared/ProtectedRoute.tsx`, `ErrorBoundary.tsx`
- `src/pages/admin/Doctors.tsx`, `src/pages/mr/MasterList.tsx`
- `src/App.tsx`, `src/hooks/useAdminDoctors.ts`, `useMasterList.ts`, `useProfile.ts`, `useExpense.ts`, `useTargets.ts`
- `src/pages/mr/Dashboard.tsx`, `src/pages/manager/Analytics.tsx`
- P1: chart lazy loaders, `dcrPdfAsync.ts`, `invalidateDashboardQueries.ts`, `useSupabaseRealtimeDashboard.ts`

### Database / docs

- `supabase/migrations/20260526130000_*` through `20260526150100_*`
- `supabase/scripts/review/P0-security-views/04_permission_matrix_before_after.md`
- `.env.example` — `VITE_SENTRY_DSN` documented

---

## 15. Migration list (this optimization pass)

| File | Apply order |
|------|-------------|
| `20260526120000_rls_initplan_daily_reports_doctors.sql` | May exist on prod |
| `20260526130000_p0a_analytics_views_select_only_grants.sql` | Staging first |
| `20260526130100_p0b_analytics_views_security_invoker.sql` | After P0a |
| `20260526140000_rls_initplan_expense_leave.sql` | Independent |
| `20260526150000_fk_indexes_safe.sql` | Independent |
| Rollbacks: `20260526130200`, `20260526130300`, `20260526140100`, `20260526150100` |

---

## Validation results

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass |
| `npm run test` | ✅ 1/1 pass |
| `npm run lint` | ⚠️ 11 pre-existing errors (unrelated files) |
| Production deploy | ❌ Not performed |
| Remote push | ❌ Not performed |
| P0 on production DB | ❌ Not applied |

---

## Approval required

**STOP — awaiting explicit approval before:**

1. `git push` / PR merge to main  
2. Vercel production promotion  
3. Supabase production migration apply (especially P0a/P0b)

Recommended next step: apply migrations on a **Supabase branch**, run role-based smoke tests, then approve production rollout.
