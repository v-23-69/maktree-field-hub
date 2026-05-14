# MakTree Medicines Field Reporting Portal

## Overview

Mobile-first PWA for pharmaceutical field operations. Three roles: **MR** (Medical Representative), **Manager**, **Admin**. Built with React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase (auth + Postgres + RLS). Uses HashRouter (`/#/`), TanStack React Query for data fetching, React Hook Form + Zod for validation, Recharts for analytics charts, xlsx for Excel exports.

---

## Authentication & Authorization

### Login (`/login`)
- Email + password via `supabase.auth.signInWithPassword`.
- On success, fetches `public.users` row by `auth_user_id`.
- If `is_blocked = true`, signs out user immediately, redirects to `/blocked-complaint`.
- Profile cached in `sessionStorage` (key `maktree-auth-profile-cache-v1`, TTL 5 min).
- Listens to `onAuthStateChange` for session refresh.
- Post-login redirect: MR → `/mr/dashboard`, Manager → `/manager/dashboard`, Admin → `/admin/dashboard`.
- Default password for new users: `Maktree@123` (set by edge function during user creation).
- **Password changes are not done in the app.** MRs, managers, and admins sign in with credentials issued or reset in **Supabase** (e.g. Authentication → Users → send password recovery, or admin API). There is no in-app “change password” flow.

### Blocked Complaint (`/blocked-complaint`)
- Shown when blocked user attempts login. Displays block reason.
- User enters email + complaint text (min 50 chars).
- Inserts row into `block_complaints` table. Admin reviews in Users page.

### Protected Routes
- `ProtectedRoute` component wraps every role-specific page.
- Checks: `authReady`, `isAuthenticated`, `user.role ∈ allowedRoles`.
- If role mismatch → redirects to user's own dashboard.

### Role Hierarchy
| Role | Code | Access |
|---------|---------|----------------------------------------|
| MR | `mr` | Own reports, master list, expenses, tour program, leave |
| Manager | `manager` | Team MR data + own reports + quick actions (CRUD) + analytics |
| Admin | `admin` | All users, doctors, areas, access control, targets, holidays, complaints |

---

## Database Schema

### Core Tables

**users**
- `id` (uuid PK), `auth_user_id` (FK → auth.users), `employee_code`, `full_name`, `email`, `role` (mr/manager/admin), `is_active`, `is_blocked`, `block_reason`, `blocked_at`, `blocked_by`
- Profile fields: `profile_photo_url`, `dob`, `aadhaar_number`, `pan_number`, `address`, `city`, `state`, `pincode`, `mobile`, `emergency_contact_name`, `emergency_contact_mobile`, `joining_date`, `designation`, `profile_complete_pct`

**areas**
- `id`, `name`, `code`, `is_active`

**sub_areas**
- `id`, `area_id` (FK → areas), `name`, `code`, `is_active`

**doctors**
- `id`, `sub_area_id` (FK → sub_areas), `doctor_code`, `full_name`, `speciality`, `qualification`, `address`, `city`, `mobile`, `birthday`, `marriage_anniversary`, `visit_frequency` (weekly/fortnightly/monthly), `master_list_complete`, `is_active`

**chemists**
- `id`, `sub_area_id`, `name`, `address`, `city`, `mobile`, `is_active`

**chemist_doctor_maps**
- `id`, `chemist_id`, `doctor_id`

**products**
- `id`, `name`, `description`, `category`, `is_active`

### Reporting Tables

**daily_reports**
- `id`, `mr_id` (FK → users), `manager_id` (FK → users), `report_date`, `status` (draft/submitted), `submitted_at`

**report_visits**
- `id`, `report_id` (FK → daily_reports), `doctor_id`, `chemist_id`, `visited_at`

**promoted_products**
- `id`, `visit_id` (FK → report_visits), `product_id`

**competitor_entries**
- `id`, `visit_id`, `brand_name`, `quantity`

**monthly_support_entries**
- `id`, `visit_id`, `product_id`, `quantity`

**report_sub_areas**
- `id`, `report_id`, `sub_area_id`

### Access Control Tables

**mr_manager_maps**
- `id`, `mr_id`, `manager_id`, `assigned_at`

**mr_sub_area_access**
- `id`, `mr_id`, `sub_area_id`

### Operational Tables

**report_unlock_requests**
- `id`, `mr_id`, `manager_id`, `reason`, `status` (pending/approved/rejected), `manager_comment`, `requested_date`, `resolved_at`

**report_issues**
- `id`, `report_id`, `mr_id`, `issue_text`, `report_date`, `status` (open/reviewed/resolved), `manager_note`

**targets**
- `id`, `mr_id`, `product_id`, `sub_area_id`, `target_qty`, `achieved_qty`, `start_date`, `end_date`, `set_by`

**leave_requests**
- `id`, `mr_id`, `manager_id`, `leave_date`, `leave_type` (full/half_morning/half_afternoon), `reason`, `status` (pending/approved/rejected), `manager_note`, `resolved_at`

**holidays**
- `id`, `name`, `holiday_date`, `holiday_type` (national/company), `created_by`

**mr_holidays**
- `id`, `mr_id`, `holiday_id`, `assigned_by`, `year`, `counts_as_leave`

**strike_reports**
- `id`, `mr_id`, `strike_date`

**expense_reports**
- `id`, `mr_id`, `report_date`, `daily_limit` (default 300), `total_used`, `status` (draft/submitted), `submitted_at`

**expense_items**
- `id`, `expense_report_id`, `category` (Travel/Food/Stationery/Printing/Communication/Other), `description`, `amount`

**tour_programs**
- `id`, `mr_id`, `month`, `status` (draft/submitted/approved/rejected), `manager_id`, `manager_note`, `is_late`, `approved_at`, `submitted_at`

**tour_program_entries**
- `id`, `tour_program_id`, `work_date`, `sub_area_id`, `working_with` (user id), `day_type` (working/sunday/holiday/leave/strike), `notes`

**block_complaints**
- `id`, `user_id`, `complaint`, `status` (pending/approved/rejected), `admin_note`, `resolved_by`, `resolved_at`

### Database Views

- `v_dcr_daily_status` — per MR per date: tour_program_done, dcr_done, expense_done, is_working_day
- `v_dcr_monthly_summary` — per MR per month: total_working_days, dcr_submitted_days, leave_days, holiday_days, strike_days, holidays_used_this_year
- `v_visit_detail` — flattened visit rows with mr_name, doctor_name, area, sub_area, report_date
- `v_monthly_support_summary` — aggregated monthly support quantities
- `v_competitor_summary` — aggregated competitor brand data
- `v_expense_monthly_summary` — per MR per month expense totals
- `v_expense_by_category` — per MR per month expense breakdown by category

### RPC Functions

- `get_doctor_alerts(p_mr_id)` — returns upcoming doctor birthdays/anniversaries (7-day window)
- `get_tour_plan_for_date(p_mr_id, p_date)` — returns tour plan entry for auto-filling DCR
- `get_month_working_days(p_mr_id, p_month)` — returns all days in month with day_type (working/sunday/holiday/leave/strike) and holiday_name
- `list_mrs_for_manager(p_manager_id)` — returns MRs mapped to a manager (deduplicated)
- `list_managers_for_mr(p_mr_id)` — returns managers mapped to an MR
- `assign_sub_areas_to_mr(p_mr_id, p_sub_area_ids)` — batch assign sub-areas, idempotent
- `login_lookup_by_employee_code` — lookup user for login account linking

### RLS (Row Level Security)

All tables have RLS enabled. Policies enforce:
- MRs: read/write own data only
- Managers: read data of their mapped MRs + own data
- Admins: full read/write access
- Specific policies exist for holidays, expenses, reports, block_complaints

---

## MR Pages

### MR Dashboard (`/mr/dashboard`)
**Sections:**
1. **Doctor Alerts** — birthday/anniversary reminders (7-day lookahead via `get_doctor_alerts` RPC). Tap navigates to master list with doctor pre-selected.
2. **Welcome** — greeting with user's first name + today's date.
3. **CTA Button** — "Start Today's Report" → navigates to `/mr/report/new`.
4. **Daily Checklist** — shows 3 items with ✓/⬜ status: Tour Program, DCR Report, Expense Report. Data from `v_dcr_daily_status`. Shows "Today is holiday/Sunday" when not a working day. Monthly summary: X days worked, Y leaves, Z holidays.
5. **Strike Button** — "Mark Today as Strike" (inserts into `strike_reports`). Disabled once marked.
6. **Upcoming Holidays** — from `mr_holidays` joined with `holidays` table.
7. **Master List Progress** — per-area progress bars showing X/Y doctors complete with color coding (green >80%, amber 50-80%, red <50%). Tap filters master list by area.
8. **My Targets** — active targets with progress bars, achieved/target quantities, days remaining.
9. **Stats Grid** — reports this month, doctors visited this week.

### New Daily Report (`/mr/report/new`)
**Block Check:** Before showing form, checks `useReportBlockStatus`. If MR has missed previous dates → shows blocked state with unlock request form. If pending request exists → shows waiting message.

**4-Step Wizard:**
1. **Step 1 (Basic Info)** — date picker (allowed dates from API), "Working With" dropdown (managers list).
2. **Step 2 (Areas)** — multi-select sub-areas from MR's assigned sub-areas.
3. **Step 3 (Visits)** — for each selected sub-area, shows doctors in that sub-area. Per doctor visit form via `DoctorVisitDrawer`:
   - Doctor selection
   - Products promoted (multi-select from products table)
   - Chemist name (text or select)
   - Competitor entries (brand name + quantity, add/remove rows)
   - Monthly support entries (product + quantity, add/remove rows)
4. **Step 4 (Submit)** — review all visits, submit report. Sets `status = 'submitted'`.

**Draft Persistence:** Form data saved to `localStorage` key `maktree_report_draft`. Restored on page reload. Cleared on successful submit.

**Tour Plan Auto-fill:** On date change, calls `get_tour_plan_for_date` RPC to pre-fill working_with and sub-area from approved tour program.

### Master List (`/mr/master-list`)
- Grouped by Area → Sub-area → Doctors.
- Per sub-area: completion progress bar (% of doctors with `master_list_complete = true`).
- Per doctor card: shows name, speciality, completion status icon (✓ or ⚠), missing field badges (mobile, address, city, qualification, birthday, marriage anniversary, visit frequency).
- Tap doctor → opens `DoctorMasterDrawer` for editing all doctor fields.
- "Add New Doctor" button per sub-area.
- URL params: `?areaId=X` filters to specific area, `?doctorId=X` auto-opens doctor drawer.

### Report History (`/mr/report/history`)
- List of all MR's daily reports sorted by date.
- Each card shows: date, visit count, status badge (Submitted/Draft).
- Tap → navigates to `/mr/report/:id` (ReportDetail page).

### Report Detail (`/mr/report/:id`)
- Full read-only view of a submitted report.
- Shows all visits with doctor details, products promoted, competitor entries, monthly support.

### Leave (`/mr/leave`)
- Apply form: date picker, leave type (Full Day / Half Day Morning / Half Day Afternoon), reason textarea.
- Auto-selects first mapped manager as `manager_id`.
- Leave history list showing date, type, reason, status (pending/approved/rejected).

### Expense (`/mr/expense`)
- Date selector: Today / Yesterday / Day -2.
- Auto-creates expense report via `getOrCreateExpenseReport` on date change.
- Daily limit display (Rs 300 default), used amount, balance.
- Add expense item: category dropdown (Travel/Food/Stationery/Printing/Communication/Other), description, amount.
- Expense items list with delete option.
- Submit button (disabled if already submitted or zero amount).

### Tour Program (`/mr/tour-program`)
- Month selector (current + next 2 months).
- Create/Refresh Draft button.
- Calendar view: all days in month. Sundays shown as "Off", holidays show name.
- Working days: sub-area dropdown + "Working With" dropdown (managers).
- Validation: all working days must have sub-area + working_with before submit.
- Status display: draft/submitted/approved/rejected (with manager note if rejected).
- Submit TP button.
- TP History section: past tour programs with status.

### Profile (`/profile`)
- Photo upload (to Supabase Storage).
- Editable fields: full_name, designation, dob, joining_date, mobile, aadhaar_number (masked display), pan_number, address, city, state, pincode, emergency_contact_name, emergency_contact_mobile.
- **Login password is not changed in the app**; use Supabase (recovery email or admin) to set or reset passwords.
- Completion progress bar (profile_complete_pct).
- Missing fields highlighted.
- Manager/Admin can view other user profiles at `/profile/:userId` (manager: read-only, admin: editable).

---

## Manager Pages

### Manager Dashboard (`/manager/dashboard`)
**Sections:**
1. **Welcome** — greeting with manager's first name.
2. **Stats Grid** — Total MRs, Reports Today, Reports This Month, Doctors Visited This Month.
3. **Time Filter Chips** — Today / This Week / This Month.
4. **Quick Actions (drawer-based):**
   - Add Doctor — name, speciality, sub-area selection → inserts into doctors table.
   - Add Area — name → inserts into areas table.
   - Add Sub-area — area selection + name → inserts into sub_areas table.
   - Assign Area to MR — select MR → select area → multi-select sub-areas → calls `assign_sub_areas_to_mr` RPC.
   - Assign Area to Self — same as above but uses manager's own user id.
   - Create MR — name, employee code, email, sub-area assignments → creates auth user + public.users row. Default password: `Maktree@123`.
   - Delete MR — select MR, optional transfer areas to another MR → deactivates user + removes auth.
   - Holidays — navigates to `/manager/holidays`.
   - Create Daily Report (Self) — navigates to `/manager/report/new` (uses same NewReport component as MR).
   - Tour Program (Self) — navigates to `/manager/tour-program`.
   - Expense (Self) — navigates to `/manager/expense`.
5. **Today Reports by MRs** — list of all mapped MRs with submitted/pending status. Tap submitted → opens report view.

### Manager Reports (`/manager/reports`)
**Three tabs: Reports | Issues | Expenses**

**Reports Tab:**
- Summary stats: Self (D/W/M counts), Selected MR (D/W/M), Team (D/W/M).
- MR selector dropdown (includes self via checkbox).
- Date picker + available dates for selected MR.
- "View Report" button → loads full report detail.
- Report detail: MR info, status badge, date, working-with manager.
- Doctor Visits list (collapsible cards): doctor name, speciality, sub-area badge, chemist, products promoted, competitor survey table, monthly support table.
- **Filters panel:** speciality, product, area, sub-area, MR, from date, to date.
- **Excel Downloads:**
  - Current report → single-day Excel with doctor visits.
  - Date range → downloads from `v_visit_detail` view with all filters applied.

**Issues Tab:**
- List of open report issues from MRs.
- Per issue: MR name, date, issue text, manager note textarea.
- Actions: Mark Reviewed / Resolve.

**Expenses Tab:**
- Monthly expense summary for team.
- Download as Excel button.
- List of expense reports with date and total used.

### Manager Analytics (`/manager/analytics`)
**Date range selector:** Daily / Weekly / Monthly / Custom presets.
**Include self checkbox** — adds manager's own data alongside MR team.
**Generate Report button** — triggers data fetch.

**Four tabs: Overview | Area Performance | Doctor Loyalty | Competitor Intel**

**Overview:**
- Total visits + unique doctors visited (summary card).
- Product-wise Promotions (horizontal bar chart).
- MR-wise Visit Count (vertical bar chart).
- Top Competitor Brands (progress bars ranked).
- Expense Overview: allotted vs used vs balance + category bar chart.

**Area Performance:**
- Area ranking by quantity (horizontal bar chart from `v_monthly_support_summary`).

**Doctor Loyalty:**
- Filterable by product and area.
- Per doctor: months written, total quantity.

**Competitor Intel:**
- Bar chart of competitor brands by quantity (from `v_competitor_summary`).

### Unlock Requests (`/manager/requests`)
**Two tabs: Unlock Requests | Tour Programs**

**Unlock Requests:**
- Pending requests: MR name, requested date, reason, Approve/Reject buttons.
- Reject requires comment.
- Resolved section: last 30 days history with status badges.

**Tour Programs:**
- Pending tour programs from MRs.
- View TP entries (date, sub-area, day_type).
- Approve / Reject (with manager note for rejection).
- Late badge shown if `is_late = true`.

### Manager Targets (`/manager/targets`)
- Set/view targets for team MRs.
- Per target: MR, product, sub-area, quantity, date range.
- Achievement tracking.

### Manager Leaves (`/manager/leaves`)
**Four tabs: Pending | Approved | Rejected | Calendar**
- Pending: leave requests with date, type, reason + Approve/Reject buttons with manager note.
- Approved/Rejected: filtered history.
- Calendar: month-grouped leave list with color-coded status.

### Manager Holidays (`/manager/holidays`)
- View/manage holidays for MRs.

---

## Admin Pages

### Admin Layout
- Desktop: fixed left sidebar (240px) with nav links.
- Mobile: hamburger menu → slide-out drawer + bottom nav.
- Top header: search bar + logout button.
- Sidebar items: Dashboard, Users, Doctors, Areas, MR Access, Targets, Holidays, Block Complaints.

### Admin Dashboard (`/admin/dashboard`)
**Sections:**
1. **Stats Grid** (clickable → navigate to respective pages): Total MRs, Total Managers, Total Doctors, Total Areas.
2. **Quick Actions:** Add User, Add Doctor, Add Area, Pending Complaints (count badge).
3. **Recent Activity Feed** — last 5 submitted reports with MR name, report date, submission time.

### Admin Users (`/admin/users`)
**Two tabs: Users | Complaints**

**Users Tab:**
- Role filter chips: All / MR / Manager / Admin.
- Add User dialog: full name, employee code, role dropdown, email.
  - For MR role: assign managers (checkboxes), assign sub-areas (grouped by area, checkboxes).
  - Creates Supabase auth user via edge function + inserts public.users row.
- User list cards: avatar initials, name, employee code, role.
- Per user actions:
  - Edit (MR only) → dialog to reassign managers + sub-areas.
  - Delete (MR only) → confirmation dialog → deactivates + removes auth.
  - Toggle Active/Inactive.
  - Block (with reason) / Unblock.

**Complaints Tab:**
- List of block complaints from blocked users.
- Per complaint: status, text, admin note textarea.
- Actions: Approve (unblocks user) / Reject.

### Admin Doctors (`/admin/doctors`)
- Filter by area → sub-area.
- Doctor list: name, speciality, sub-area, area.
- Add Doctor dialog: name, speciality, area, sub-area.
- Edit Doctor dialog: update name, speciality.
- Deactivate doctor button.

### Admin Areas (`/admin/areas`)
- Area list with sub-area count.
- Add Area dialog.
- Per area: list of sub-areas with Add Sub-area button.
- Edit buttons (placeholder, not yet implemented).

### Admin MR Access (`/admin/mr-access`)
- Select MR dropdown.
- Shows all areas → sub-areas as checkboxes.
- Toggle individual sub-areas or entire areas.
- Select All / Deselect All buttons.
- Save button → updates `mr_sub_area_access` table.

### Admin Targets (`/admin/targets`)
- Set targets: MR, product, sub-area, quantity, start/end date.
- View/edit existing targets.

### Admin Holidays (`/admin/holidays`)
- Add holiday: name, date, type (national/company).
- Holiday list.
- Assign holidays to MRs.

---

## Shared Components

| Component | Purpose |
|---------------------|---------|
| `PageHeader` | Top bar with title, optional back button |
| `BottomNav` | Fixed bottom navigation, role-specific tabs. MR: Home, DCR Report, Master List, Tour Program, Expense, History. Manager: Home, Reports, Requests (with badge), Leaves, Targets, Analytics. Admin: Home, Users, Doctors, Areas, Access |
| `StatCard` | Metric display card (icon + value + label) |
| `LoadingSpinner` | Centered spinner |
| `EmptyState` | "No data" message |
| `ProtectedRoute` | Auth + role guard wrapper |
| `ConfirmDialog` | Destructive action confirmation |
| `ErrorBoundary` | React error boundary |
| `InstallPrompt` | PWA install prompt |
| `AppLogo` | Brand logo component |
| `AdminLayout` | Desktop sidebar + mobile drawer + header for admin pages |

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Auth context: signIn, logout, user, authReady, blockedInfo |
| `useAreas` / `useAllAreas` / `useMrSubAreas` | Fetch areas, sub-areas, MR-specific sub-area access |
| `useDoctors` | Fetch doctors by sub-area |
| `useReport` / `useReportBlockStatus` / `useRequestReportUnlock` | Report CRUD, block status check, unlock requests |
| `useReportIssues` / `useManagerReportIssues` | Report issue management |
| `useManagerTeam` / `useManagerMrs` | Fetch MRs mapped to manager |
| `useManagers` / `useManagersForMr` | Fetch managers, managers mapped to MR |
| `useManagerAnalytics` | Analytics data: product promotions, MR visits, competitors, area performance, doctor loyalty, competitor intel |
| `useDashboardStats` | MR/Manager/Admin dashboard stat queries |
| `useTargets` / `useMrTargets` | Target CRUD and achievement data |
| `useLeaves` / `useApplyLeave` / `useManagerLeaves` / `useResolveLeave` | Leave request lifecycle |
| `useHolidays` / `useMrHolidays` | Holiday management |
| `useExpense` / `useManagerExpense` | Expense report CRUD, manager expense view |
| `useTourProgram` | Tour program CRUD, entries, submission, history, manager review |
| `useStrike` / `useTodayStrike` / `useMarkStrike` | Strike day management |
| `useMasterList` / `useMasterListByMr` | Master list completion data |
| `useProducts` | Fetch active products |
| `useProfile` / `useUpdateProfile` / `useUploadProfilePhoto` | User profile management |
| `useBlockSystem` | Block/unblock users, complaints |
| `useUnlockRequests` | Manager unlock request management |
| `useAdminUsers` / `useCreateUser` / `useToggleUserActive` / `useDeleteMrUser` | Admin user CRUD |
| `useAdminDoctors` / `useAddDoctor` / `useUpdateDoctor` / `useDeactivateDoctor` | Admin doctor CRUD |
| `useAdminAreasMutations` / `useAddArea` / `useAddSubArea` | Admin area/sub-area mutations |
| `useAdminMrAccess` | Admin MR sub-area access management |

---

## Key Business Logic

### Report Block System
- If MR misses submitting DCR for any past working day, new report creation is blocked.
- MR must submit unlock request with reason.
- Manager approves/rejects. On approval, MR can resume reporting.

### Tour Program Flow
1. MR creates draft TP for a month.
2. Fills sub-area + working_with for each working day (sundays and holidays auto-marked).
3. Submits TP → status changes to `submitted`.
4. Manager reviews in Requests page → approves or rejects (with note).
5. Approved TP auto-fills DCR form when creating reports for those dates.

### Master List Completion
- Each doctor has `master_list_complete` boolean.
- Completeness requires: mobile, address, city, qualification, birthday, marriage_anniversary, visit_frequency.
- Dashboard shows area-level completion percentages.

### Expense System
- Daily limit of Rs 300 per MR.
- Categories: Travel, Food, Stationery, Printing, Communication, Other.
- Auto-creates expense report on date selection.
- MR can add/delete items, then submit.

### Doctor Alerts
- RPC `get_doctor_alerts` checks doctors' birthday and marriage_anniversary fields.
- Returns doctors with events within 7 days.
- Shown as alerts on MR dashboard.

### Working Day Calculation
- RPC `get_month_working_days` determines day types for each date in a month:
  - `working` — regular working day
  - `sunday` — weekly off
  - `holiday` — from mr_holidays/holidays tables
  - `leave` — approved leave
  - `strike` — strike day marked by MR

---

## File Structure

```
src/
├── App.tsx                    # Routes + providers
├── main.tsx                   # Entry point
├── lib/
│   ├── supabase.ts           # Supabase client init
│   ├── utils.ts              # cn() utility
│   └── dateUtils.ts          # Date formatting helpers
├── types/
│   └── database.types.ts     # All TypeScript interfaces
├── hooks/                     # All data hooks (listed above)
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── shared/               # PageHeader, BottomNav, StatCard, ProtectedRoute, etc.
│   ├── admin/                # AdminLayout
│   └── mr/                   # ReportStep1-4, DoctorVisitDrawer, DoctorMasterDrawer
├── pages/
│   ├── auth/                 # Login, BlockedComplaint
│   ├── mr/                   # Dashboard, NewReport, MasterList, ReportHistory, ReportDetail, Leave, Expense, TourProgram
│   ├── manager/              # Dashboard, Reports, Analytics, UnlockRequests, Targets, Leaves, Holidays
│   ├── admin/                # Dashboard, Users, Doctors, Areas, MRAccess, Targets, Holidays
│   ├── profile/              # Profile
│   ├── Index.tsx             # Root redirect
│   └── NotFound.tsx          # 404
supabase/
├── migrations/               # Sequential SQL migrations
└── scripts/                  # Utility SQL scripts
```
