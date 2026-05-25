# Post-P0 optimization roadmap

Incremental, production-safe, reversible. Ordered by impact × risk.

**Completed:** P1 frontend bundle, targeted realtime invalidation, RLS initplan (`daily_reports`, `doctors`).

---

## Phase P2 — Data loading at scale

### 1. Pagination strategy (doctors / admin / master list)

**Problem:** `useAdminDoctorsList`, MR Master List per sub-area, and manager team master views load full datasets client-side (~768 doctors today; Baramati-scale → 10k–100k).

**Approach (incremental):**

| Surface | Strategy | API shape |
|---------|----------|-----------|
| Admin Doctors | Server-side page + search | RPC `list_doctors_admin(p_area_id, p_sub_area_id, p_search, p_limit, p_offset)` returning `{ rows, total_count }` |
| MR Master List | Sub-area scoped pages | Keep sub-area filter; add `limit/offset` on `doctors` + completion view keyed by `mr_id` + `sub_area_id` |
| Manager team doctor lists | Reuse MR pattern per `mrId` | Same RPC with manager RLS |

**Why:** PostgREST `.range()` on indexed `(sub_area_id, full_name)` avoids full-table transfer.

**Risk:** LOW–MED — UI adds “Load more” or infinite scroll; filters unchanged.

**Rollback:** Feature flag `VITE_USE_PAGINATED_DOCTORS=false` → old hooks.

**Gain:** Stable memory and TTI with 50k+ rows.

---

### 2. Virtualized table / list implementation plan

**When:** After pagination (virtualize each page, not entire table).

**Library:** `@tanstack/react-virtual` (aligns with TanStack Query).

| Component | Change |
|-----------|--------|
| `AdminDoctors.tsx` | Virtualize filtered rows; sticky header |
| `MasterList.tsx` doctor cards | Virtual list in sub-area panel |
| `ManagerReports.tsx` visit cards | Virtualize long visit lists |
| `ReportHistory.tsx` | Optional if history > 100 rows |

**Pattern:**

```tsx
// Pseudo: parent fixed height, virtualizer over row array
const virtualizer = useVirtualizer({ count: rows.length, getScrollElement, estimateSize: 72 })
```

**Risk:** LOW — visual parity if row height stable.

**Rollback:** Revert to `.map()` render.

**Gain:** Smooth scroll with 1k+ DOM rows avoided.

---

### 3. `select('*')` cleanup strategy

**30+ occurrences** — overfetching and wider RLS surface.

**Phased by traffic:**

| Priority | Files | Replace with |
|----------|-------|----------------|
| P2a | `useAdminDoctorsList`, `useMasterList`, `MasterList` inline query | Explicit doctor columns used in UI |
| P2b | `useExpense`, `useTourProgram`, `useTargets` | Column lists from `database.types` |
| P2c | `useProfile`, `useAdminUsers` | Profile/admin field subsets |

**Process:**

1. Grep `select('*')` → classify by table.
2. Generate typesafe column constants per hook (`DOCTOR_LIST_COLUMNS`).
3. One hook per PR; no mass replace.

**Risk:** LOW — missing column shows in QA quickly.

**Rollback:** Revert hook file.

**Gain:** 15–40% smaller payloads on wide tables.

---

## Phase P3 — Observability & stability

### 4. Monitoring / observability integration plan

**Goal:** Production-safe visibility without PHI in logs.

| Layer | Tooling | Implementation |
|-------|---------|----------------|
| Frontend errors | Sentry (or similar) | `ErrorBoundary` + `QueryClient` global `onError`; scrub email/mobile |
| Web vitals | Vercel Analytics / `web-vitals` | LCP on dashboard routes |
| Supabase | Dashboard + advisors | Weekly `get_advisors` security/performance |
| Auth failures | Structured client log | Login error codes only |
| RPC latency | Optional Sentry breadcrumbs | Slow query > 3s |

**Env-gated:** `VITE_SENTRY_DSN` — no-op when unset.

**Risk:** LOW — additive.

**Rollback:** Remove SDK init in `main.tsx`.

---

## Phase P4 — Database & RLS (remaining)

### 5. Remaining RLS optimization opportunities

**Done:** `daily_reports`, `doctors` initplan (`20260526120000_rls_initplan_daily_reports_doctors.sql`).

**Next (table-by-table, same `(SELECT fn())` pattern):**

| Priority | Table(s) | Reason |
|----------|----------|--------|
| P4a | `expense_reports`, `expense_items` | Dashboard + manager team expense |
| P4b | `tour_programs`, `tour_program_entries` | TP status hot path |
| P4c | `leave_requests`, `report_unlock_requests` | Manager pending counts |
| P4d | `users` | Policies still use `auth.jwt()` inline — initplan + move role to `app_metadata` only |

**Consolidate policies (higher risk, separate project):**

- 281 `multiple_permissive_policies` — merge per table/role/action in staging only.
- Requires policy matrix spreadsheet before merge.

**Indexes (after EXPLAIN on staging):**

- 29 unindexed FKs — add only for FKs used in JOIN/WHERE at scale.
- 5 duplicate indexes — drop one duplicate per pair after `pg_stat_user_indexes` confirms unused.

**RPC hardening (security, not perf):**

- Audit 44 `anon` + 44 `authenticated` executable definer RPCs — ensure each checks `session_profile_id()` / role.

---

## Suggested timeline

| Sprint | Items |
|--------|--------|
| Now | Smoke P1 + realtime; review P0 SQL |
| +1 | P0a → P0b on branch + validation checklist |
| +2 | Pagination admin + MR master list |
| +3 | Virtualize admin + master list |
| +4 | `select('*')` P2a–b |
| +5 | Sentry + route error boundaries |
| +6 | RLS initplan P4a–b; duplicate index cleanup |

---

## Principles (unchanged)

- No destructive data migrations
- One concern per migration file
- Every DB change has matching rollback SQL
- Feature flags for frontend data-path changes
- Never cache stale DCR/TP/expense submission state
