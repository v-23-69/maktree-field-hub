# Production Deployment Report — Enterprise Optimization

**Deployed:** 2026-05-26  
**Merge commit:** `08bc01a6a2eeeaf57ffd504df1039741b4cedecc`  
**Feature tip:** `290e0d9` (vendor-recharts chunk)  
**Vercel deployment:** `dpl_fqQxWDxfik8JG4ALSCN6AH8LaY8G` — **READY**

---

## 1. Production deployment status

| Item | Status |
|------|--------|
| Pre-deploy build | Pass |
| Pre-deploy tests | Pass (1/1) |
| Pre-deploy lint | 11 pre-existing errors (non-blocking) |
| Git merge to `main` | Complete |
| `main` push | Complete |
| Vercel production build | **READY** |
| HTTP smoke (`/`) | 200 OK |

---

## 2. Deployment URLs

| URL | Role |
|-----|------|
| https://maktree.vercel.app | **Production** (primary alias) |
| https://maktree-v-23-69s-projects.vercel.app | Production team alias |
| https://maktree-git-main-v-23-69s-projects.vercel.app | Git branch alias |
| https://vercel.com/v-23-69s-projects/maktree/fqQxWDxfik8JG4ALSCN6AH8LaY8G | Inspector / build logs |

---

## 3. Commit hash deployed

- **Production target:** `08bc01a6a2eeeaf57ffd504df1039741b4cedecc`  
  `Merge branch 'feat/enterprise-optimization-staging': enterprise optimization production rollout`
- **Previous production:** `47e2c61` (rollback candidate on Vercel)

---

## 4. Migration status (Supabase `limgkjuywvudkxnantda`)

All optimization migrations **already applied** before/at staging validation:

| Migration | Status |
|-----------|--------|
| `rls_initplan_daily_reports_doctors` | Applied (`20260525184451`) |
| `rls_initplan_expense_leave` | Applied |
| `fk_indexes_safe` | Applied |
| `p0a_analytics_views_select_only_grants` | Applied |
| `p0b_analytics_views_security_invoker` | Applied |

No additional DB migration required at deploy time.

---

## 5. Warnings

1. **Lint:** 11 pre-existing ESLint errors (unchanged); deployment not blocked.
2. **Supabase branching:** Pro plan required for isolated DB branches.
3. **Sentry:** Not enabled — set `VITE_SENTRY_DSN` in Vercel Production env when ready (optional).
4. **Untracked local files:** Baramati Excel/chunk SQL not deployed.

---

## 6. Known remaining issues

- Secondary `select('*')` cleanup on `useTourProgram`, `useLeaves`, `useReport` (roadmap).
- Vitest coverage minimal (placeholder test).
- Manual production smoke recommended for 24h after deploy (user reported staging validation complete).

---

## 7. Rollback readiness

| Layer | Action |
|-------|--------|
| **Vercel** | Promote previous deployment `dpl_8M9qfTa7sKQFhLLg48uzppEbeUX4` (`47e2c61`) from dashboard |
| **Git** | `git revert -m 1 08bc01a` and push `main` |
| **DB P0b** | `20260526130300_p0b_rollback_*.sql` |
| **DB P0a** | `20260526130200_p0a_rollback_*.sql` |
| **DB FK** | `20260526150100_rollback_fk_indexes_safe.sql` |
| **DB expense/leave** | `20260526140100_rollback_rls_initplan_expense_leave.sql` |

---

## 8. Performance improvement summary

- Lazy **recharts** + **dcrPdf** chunks (off critical path)
- **vendor-recharts** manual chunk in production HTML (verified)
- Targeted realtime invalidation (fewer refetches)
- Server-side doctor pagination + virtualized admin list
- Explicit column selects on hot queries

---

## 9. Scalability improvement summary

- Admin doctors: 50 rows/page vs full-table fetch
- MR master list: 80 rows/page + load more
- FK indexes on expense items, report visits, leave requests, tour program entries

---

## 10. Security improvement summary

- Analytics views: **SELECT-only** grants for API roles
- 9 definer views: **security_invoker=true**
- RLS initplan on daily_reports, doctors, expense_reports, leave_requests
- Rollback SQL artifacts in repo

---

## Automated post-deploy checks

- [x] Production HTML loads (200)
- [x] `vendor-recharts` chunk present in modulepreload
- [x] PWA manifest link present
- [x] Supabase preconnect in index.html
- [x] Vercel build state READY

## User-reported validation (staging)

- [x] Testing and validation complete (per product owner sign-off)
