# Portal UI/UX reference export

> Source: MakTree Medicines Portal (maktree-field-hub)
> Generated: 2026-06-03
> Purpose: Visual/layout inspiration for Ellure NexHire dashboards (admin, client, applicant) — not feature parity.

## 1. Executive summary

MakTree Field Hub is a **mobile-first field operations portal** built on React + Vite + Tailwind + shadcn/ui. The design language blends **consumer-app polish** (glass headers, bottom navigation, touch feedback, safe-area padding) with **operational density** (KPI cards, progress bars, segmented filters, virtualized lists). Light mode is the default; dark mode uses deep blue-gray surfaces. Primary accent is a saturated blue (`hsl(221 83% 53%)`). Cards use **rounded-2xl**, subtle borders (`border-border/80`), and light shadows — not heavy elevation. Typography is tight and compact on mobile (labels down to 8–10px in stat grids).

**Top 5 patterns worth borrowing for a recruiting portal**

1. **Dual navigation model** — persistent sidebar on desktop (`lg+`) for admin; fixed glass bottom nav (5 items) for MR/manager mobile with safe-area inset.
2. **`dashboardPageClass()` responsive canvas** — centered max-width that grows from phone → tablet → laptop (`max-w-lg` → `max-w-3xl` → `max-w-5xl/6xl`).
3. **Welcome hero + stat link cards** — gradient greeting panel with avatar ring, followed by KPI cards that deep-link to list pages (footer chevron on mobile).
4. **Card-based lists instead of tables** — alternating `bg-card` / `bg-card/80` rows with avatar initials, inline actions; virtualized for long lists.
5. **Semantic alert panels** — amber/destructive/sky/emerald tinted borders + 5% background fills for status messaging (deadlines, approvals, empty holidays).

**Top 5 patterns to avoid for recruiting UX**

1. **Extremely small mobile stat typography** (`text-[8px]`–`text-[9px]`) — hurts readability for non-power users.
2. **5-column quick-action grids on narrow phones** — too cramped for diverse recruiting workflows; prefer 3–4 columns or scroll.
3. **No dedicated messaging/chat UI** — not applicable here; do not infer inbox patterns from notification sheet alone.
4. **Admin header search placeholder** — global search bar is decorative (not wired); avoid copying non-functional chrome.
5. **HashRouter-specific navigation** — layout patterns transfer; routing implementation does not.

---

## 2. Design tokens

### 2.1 Color palette (light)

| Token / role | Value | Usage |
|--------------|-------|-------|
| `--background` | `hsl(210 17% 97%)` | Page canvas, body |
| `--foreground` | `hsl(220 20% 14%)` | Primary text |
| `--card` | `hsl(0 0% 100%)` | Card surfaces, sidebar (admin) |
| `--primary` | `hsl(221 83% 53%)` | CTAs, active nav, links, rings |
| `--primary-foreground` | `hsl(0 0% 100%)` | Text on primary buttons |
| `--secondary` | `hsl(220 14% 96%)` | Secondary buttons, badges |
| `--muted` | `hsl(220 14% 96%)` | Skeleton, progress track |
| `--muted-foreground` | `hsl(220 9% 46%)` | Captions, hints, inactive nav |
| `--accent` | `hsl(220 14% 96%)` | Hover states on outline controls |
| `--accent-foreground` | `hsl(221 83% 40%)` | Accent text |
| `--destructive` | `hsl(0 84% 60%)` | Errors, strike actions, badge counts |
| `--border` | `hsl(214 20% 90%)` | Card borders, dividers |
| `--input` | `hsl(214 20% 90%)` | Input borders |
| `--ring` | `hsl(221 83% 53%)` | Focus rings |
| `--chart-1` … `--chart-5` | blue, cyan, green, amber, purple HSL | Recharts series |
| `--glass-bg` | `rgba(255,255,255,0.72)` | Frosted header/nav |
| `--glass-border` | `rgba(255,255,255,0.45)` | Glass edge |
| `--glass-shadow` | `0 2px 16px rgba(0,0,0,0.04)` | Glass elevation |

Semantic Tailwind utilities used beyond tokens: `emerald-500/600` (success), `amber-500/600` (warning), `sky-500/600` (info), `violet-500/600` (secondary actions), `red-600` (negative deltas).

### 2.2 Color palette (dark)

| Token / role | Value | Usage |
|--------------|-------|-------|
| `--background` | `hsl(224 20% 8%)` | Page canvas |
| `--foreground` | `hsl(210 20% 92%)` | Primary text |
| `--card` | `hsl(224 18% 11%)` | Cards, popovers |
| `--primary` | `hsl(221 70% 60%)` | Slightly lighter blue for contrast |
| `--muted` | `hsl(220 14% 16%)` | Tracks, subtle fills |
| `--muted-foreground` | `hsl(215 12% 55%)` | Secondary text |
| `--border` | `hsl(220 12% 18%)` | Borders |
| `--destructive` | `hsl(0 72% 55%)` | Destructive actions |
| `--glass-bg` | `rgba(18,22,30,0.75)` | Frosted surfaces |
| `--glass-border` | `rgba(255,255,255,0.08)` | Glass edge |
| `--glass-shadow` | `0 2px 20px rgba(0,0,0,0.25)` | Glass elevation |
| Sidebar tokens | `--sidebar-*` mirror card/primary | Reserved for shadcn sidebar (partially unused) |

Theme toggle: `localStorage` key `maktree-theme`; values `light` \| `dark` \| `system` (system coerced to light on load). Applied via `document.documentElement.classList` in `src/hooks/useTheme.tsx`.

### 2.3 Typography

| Role | Font | Size / weight | Notes |
|------|------|---------------|-------|
| Body | Inter (`font-sans`) | 16px base, `-0.011em` letter-spacing | Antialiased |
| Brand / login | Sora (`font-brand`) | Used in `MaktreeBrand` | Login hero only |
| Page title (back header) | Inter | `text-[15px] font-bold tracking-tight` | `PageHeader` with `showBack` |
| Section title (dashboard) | Inter | `text-sm md:text-base font-semibold` | `DashboardSection` in `dashboard-shell.tsx` |
| Section title (glass card) | Inter | `text-sm font-bold` | `shared/DashboardSection.tsx` |
| Stat value (KPI) | Inter | `text-2xl md:text-3xl font-semibold tabular-nums` | Shrinks to `text-lg` on mobile in 3-col grid |
| Stat label | Inter | `text-sm` → `text-[9px]` on mobile | Aggressive shrink in stat cards |
| Section label utility | Inter | `.section-title`: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` | Profile theme picker |
| Caption / meta | Inter | `text-xs`, `text-[10px]`, `text-[11px]` | Dates, counts, hints |
| Button | Inter | `text-sm font-semibold` | shadcn `Button` default |

Headings `h1–h4` use `-0.025em` letter-spacing globally.

### 2.4 Spacing & layout grid

| Breakpoint | Page horizontal padding | Max content width | Section gap |
|------------|-------------------------|-------------------|-------------|
| Default (mobile) | `px-4`, `py-5` | `max-w-lg` (~512px) | `space-y-5` |
| `md` (≥768px) | `px-8`, `py-6` | `max-w-3xl` (~768px) | `space-y-6` |
| `lg` (≥1024px) | `px-10` | `max-w-5xl` (~1024px) | `space-y-6` |
| `xl` (≥1280px) | `px-10` | `max-w-6xl` (~1152px) | — |

Admin content area: `px-3 sm:px-4 py-4` inside `lg:pl-60` offset.

Grid helpers (`src/components/dashboard/dashboard-shell.tsx`):

- `dashboardTablet2Col`: 1 col → `md:grid-cols-2`
- `dashboardTablet3Col`: 1 → `md:2` → `lg:3`

Bottom nav content max-width mirrors page: `max-w-lg md:max-w-2xl lg:max-w-3xl`.

### 2.5 Radius, border, shadow

| Element | Radius | Border | Shadow |
|---------|--------|--------|--------|
| Base `--radius` | `0.75rem` (12px) | — | — |
| Cards / panels | `rounded-2xl` (`dashboardPanelClass`) | `border border-border/80` | `shadow-sm` |
| shadcn Card default | `rounded-lg` | `border` | `shadow-sm` |
| Buttons (portal) | `rounded-lg`, `rounded-xl` | outline variant: `border-input` | active: `shadow-sm` on toolbar |
| Inputs | `rounded-lg` / `rounded-xl` (login: `rounded-xl border-2`) | `border-input` | — |
| Avatars | `rounded-full` | `ring-2` or `ring-[3px] ring-primary/15` | optional `shadow` |
| Bottom nav indicator | `rounded-full` 2.5px × 20px bar | top border on nav | glass shadow |
| Dialog | `sm:rounded-lg`, often overridden `rounded-xl` | `border` | `shadow-lg` |
| Sheet (right) | full height | `border-l` | `shadow-lg` |

Glass utilities (`src/index.css`): `.glass`, `.glass-card` (`rounded-2xl`), `.glass-subtle` with `backdrop-filter: blur(12–20px)`.

### 2.6 Icons (library, sizes)

- **Library:** `lucide-react` throughout
- **Nav / header:** `h-4 w-4` (sidebar), `h-5 w-5` (bottom nav, header back)
- **Bottom nav (active):** `h-5 w-5 md:h-6 md:w-6`, `stroke-[2.5]` when active
- **Quick action tiles:** icon in `h-8 w-8` or `h-9 w-9` rounded-xl container
- **Empty state:** `Inbox` at `h-8 w-8` inside `h-16 w-16 rounded-2xl bg-muted`
- **Loading:** `Loader2` `h-8 w-8 animate-spin text-primary`

---

## 3. Responsive system

| Breakpoint | Sidebar | Header | Main content | Lists/tables | Nav |
|------------|---------|--------|--------------|--------------|-----|
| **Mobile** (<768px) | Hidden; admin uses slide-in drawer (`w-64`, overlay `bg-foreground/30 backdrop-blur-sm`) | MR/Manager: sticky glass `PageHeader` (~4rem + safe-area). Admin: compact sticky bar with hamburger + search + avatar | Single column; `pb-24` for bottom nav; mobile reorder via `max-md:order-[n]` on dashboard | Card lists; stat grid forced 3-col with tiny text; infinite scroll / virtualized lists | Fixed bottom `BottomNav` (5 items), glass, safe-area bottom padding |
| **Tablet** (768px–1023px) | Admin drawer still; no persistent sidebar until `lg` | Same headers; wider `md:px-8` | `max-w-3xl`; 2-col grids (`md:grid-cols-2`) for targets, stats | Filters inline (selects side-by-side); pagination buttons | Bottom nav still visible for all roles (`lg:hidden` only on admin bottom nav wrapper) |
| **Desktop** (≥1024px) | Admin: fixed `w-60` sidebar, `bg-card`, `border-r` | Admin: no hamburger; MR/Manager unchanged (no sidebar) | Admin: `lg:pl-60`, no bottom padding; MR/Manager: `max-w-5xl`/`6xl` | Virtualized card lists; admin 2-col quick actions → 4-col | Admin: sidebar nav only; bottom nav hidden (`lg:hidden`) |

**Mobile breakpoint constant:** `768px` in `src/hooks/use-mobile.tsx` (`useIsMobile`).

**Tailwind defaults used:** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1400px (container).

---

## 4. App shell & navigation

### Shell components

| Role | Shell | File |
|------|-------|------|
| Admin | `AdminLayout` — sidebar + sticky header + optional mobile bottom nav | `src/components/admin/AdminLayout.tsx` |
| MR / Manager | Per-page: `PageHeader` + `BottomNav` + `dashboardPageClass()` wrapper | `src/components/shared/PageHeader.tsx`, `src/components/shared/BottomNav.tsx`, `src/components/dashboard/dashboard-shell.tsx` |
| Profile | Same as MR/Manager with back header | `src/pages/profile/Profile.tsx` |

### Sidebar behavior (admin)

- **Desktop (`lg+`):** Fixed left, width **240px** (`w-60`), full viewport height, `bg-card`, `border-r border-border`
- **Header block:** `h-14`, logo `h-11 w-11` + bold `text-sm` title "MakTree Admin"
- **Nav items:** `rounded-lg px-3 py-2.5 text-sm font-medium`, icon `h-4 w-4` + label
- **Active:** `bg-primary/10 text-primary`
- **Inactive:** `text-muted-foreground hover:bg-muted hover:text-foreground`
- **No collapse/expand** — always expanded on desktop
- **No footer user block** in sidebar — profile accessed via header avatar
- **Mobile drawer:** `w-64`, `animate-slide-in-left`, close via overlay tap or X button

### Header patterns

**MR/Manager `PageHeader`:**

- Sticky top, `z-30`, `.glass`, `border-b border-border/40`
- `minHeight: calc(4rem + env(safe-area-inset-top))`
- Home: compact brand (`MaktreeBrand`); inner pages: back button `h-10 w-10 rounded-xl` + truncated title
- Right: `NotificationBell` (MR/manager only) + profile avatar `h-9 w-9 rounded-full`

**Admin header:**

- Sticky `bg-card shadow-sm border-b`, `py-2.5`
- Hamburger (mobile only), decorative search input `h-9 max-w-sm pl-9`, profile `h-8 w-8`

### Mobile bottom nav

- **Items:** 5 per role (see `NAV_ITEMS` in `BottomNav.tsx`)
- **MR:** Home, Doctors, Visits, Performance, History
- **Manager:** Home, Team, Performance, Reports, History
- **Admin (mobile only):** Home, Users, Doctors, Territories, Access
- **Active state:** primary text color + top `2.5px` primary bar; thicker stroke on icon
- **Inactive:** `text-muted-foreground/70`
- **Labels:** `text-[10px] md:text-[11px] font-semibold`
- **No overflow "More" menu** — exactly 5 slots; secondary routes reached from dashboard/quick actions

### Role-specific accents

- No distinct accent color per role — all use same primary blue
- Role shown as uppercase pill on profile card: `bg-primary/10 text-primary text-[10px]`
- Manager notification sheet adds amber approval card when pending count > 0

---

## 5. Component patterns (with file paths)

### 5.1 Cards (stat, content, interactive)

| Pattern | Description | Files |
|---------|-------------|-------|
| **Panel chrome** | `rounded-2xl border border-border/80 bg-card shadow-sm` | `dashboard-shell.tsx` → `dashboardPanelClass()` |
| **Stat link cards** | KPI value + optional delta + footer link; mobile footer becomes chevron only | `dashboard-stat-link-cards.tsx` |
| **Glass stat card** | Icon tile + large value + label | `StatCard.tsx` |
| **Quick action tile** | Icon in tinted `rounded-xl` box + micro label; `active:scale-95` | MR Dashboard, `ManagerQuickAction.tsx` |
| **Welcome hero** | Gradient `from-primary/10 via-primary/5`, avatar with ring, greeting | `pages/mr/Dashboard.tsx`, `pages/manager/Dashboard.tsx` |
| **Glass section card** | Frosted container with optional icon header | `shared/DashboardSection.tsx` |
| **Profile summary** | Cover gradient + overlapping avatar + completion bar + 2-col stat grid | `profile-summary-card.tsx` |
| **Alert / status card** | Tinted border + 5% bg (amber, destructive, emerald, sky) | Dashboard alerts throughout |
| **Progress card** | Title + `%` badge + `h-2 rounded-full` bar (emerald/amber/destructive thresholds) | Targets sections, Master List coverage |

**Hover / active:** `active:scale-95` or `active:scale-[0.98]` on tappable cards; admin list cards use staggered `animate-fade-in` with delay.

### 5.2 Data tables → mobile transformation

- **No `<Table>` usage in routed pages** — `src/components/ui/table.tsx` exists (min-width 640px, horizontal scroll wrapper) but lists are **card-based everywhere**
- **Admin/MR list row:** `flex items-center gap-3 rounded-xl p-4 shadow-sm`, alternating `bg-card` / `bg-card/80`
- **Avatar column:** `h-10 w-10 rounded-full bg-primary/10` with initials
- **Actions:** icon buttons or `Button size="sm"` on the right
- **Long lists:** `VirtualizedScrollList` (`src/components/shared/VirtualizedScrollList.tsx`) — estimate ~76px row height
- **MR doctor list:** Grouped sections (pending, incomplete, complete) inside scrollable panel `max-h-[min(50vh,400px)]`
- **Pagination:** Prev/next icon buttons + "Showing X–Y of Z" caption (`AdminDoctors.tsx`) — not full page numbers

### 5.3 Filters & search

| Pattern | UI | Files |
|---------|-----|-------|
| **Role chip filters** | `rounded-full px-3 py-1.5 text-xs border`; active = filled primary | `AdminUsers.tsx` |
| **Tab toggle** | Two full-width `Button` variants (default vs outline) | Users complaints tab |
| **Dual `<select>` filters** | Side-by-side `h-10 rounded-lg` native selects | `AdminDoctors.tsx` |
| **Search with icon** | `Search` absolute left-3, input `pl-9 h-10 rounded-lg` | Admin doctors, MR master list |
| **Debounced search** | 300ms timeout | Master list, admin doctors |
| **Period presets** | Row of `Button size="sm" h-8` weekly/monthly/yearly/custom | `Analytics.tsx`, `ActionToolbar` |
| **Date range picker** | Preset buttons + from/to date inputs + calendar popover in panel | `analytics-date-range-picker.tsx` |
| **Area pager** | Horizontal territory/sub-area selector | `AreaSelectPager.tsx` |
| **Segmented toolbar** | Rounded container `bg-muted/30 p-1` with pill active state | `action-toolbar.tsx` |

**Drawer vs inline:** Filters inline at top of page; detail editing uses **Dialog** (admin) or **Sheet/Drawer** (MR doctor master).

### 5.4 Charts & dashboards

| Chart type | Library | Theming | Files |
|------------|---------|---------|-------|
| Radial KPI rings | Recharts `RadialBarChart` | Primary + keys a–d colors | `dashboard-radial-metrics.tsx` |
| Activity rings (Apple-style) | Custom SVG + framer-motion | Gradient strokes per metric | `activity-rings-card.tsx`, `apple-activity-ring.tsx` |
| Bar charts (speciality, calls) | Recharts lazy-loaded | Tooltip uses CSS vars via `analyticsChartTheme.ts` | `LazySpecialityBarChart.tsx`, `MrCallsDayChart.tsx` |
| Period comparison bars | Recharts hatched bars | Muted cursor fill | `HatchedComparisonBarChart.tsx`, `PeriodComparisonBarChart.tsx` |
| Donut / pie | Custom | Team analytics | `AnalyticsDonutPie.tsx` |
| Leaderboard | Podium + ranked list with pagination | Panel card wrapper | `leaderboard-card.tsx` |
| Chart container | shadcn `ChartContainer` | `--chart-1`…`5` CSS vars | `ui/chart.tsx` |

**Responsive chart height:** Radial metrics fixed `72×72px`; bar charts typically in `glass-card` with `min-h` implied by content; heavy charts deferred 200ms on analytics pages.

**Dashboard home widgets:** Stat cards, radial metrics, quick action grid, recent activity list (icon + text + timestamp), birthday slot, leaderboard (manager).

### 5.5 Messaging / chat UI

**Not present in this codebase.** Closest equivalent:

- **Notification bell → right Sheet** (`NotificationBell.tsx`): list of notification rows with avatar circle, title, body, date — not a conversational thread UI
- **Contact support:** Single link row on profile → separate page (`ContactSupport.tsx`)

For Ellure messages, treat notification sheet as **inspiration for a slide-over inbox list**, not chat bubbles.

### 5.6 Profile / detail pages

- **Layout:** `max-w-md md:max-w-xl lg:max-w-2xl mx-auto`, single column
- **Hero card:** `ProfileSummaryCard` with completion progress
- **Detail rows:** `glass-card divide-y` — icon + uppercase micro-label + value (`InfoRow` in Profile.tsx)
- **Inline edit:** Expandable form in `glass-card` with `animate-fade-in`
- **Theme selector:** 3-column grid of light/dark/system with ring active state
- **Team MR detail (manager):** Tabbed subviews in dedicated page — `TeamMrDetail.tsx` + tabs under `components/manager/team/`

### 5.7 Settings pages

- No dedicated `/settings` route — settings distributed:
  - **Profile page:** theme, logout, edit profile, support link
  - **Admin sidebar:** MR Access, Targets, Holidays as admin "settings-like" pages
- **Form pattern:** `Label text-xs` + `Input rounded-lg` + full-width primary save button
- **Dialog forms:** `max-w-[360px] rounded-xl max-h-[90vh] overflow-y-auto` for create user/doctor

### 5.8 Notifications

- **Bell button:** `h-10 w-10 rounded-xl`, destructive badge `min-w-[17px] h-[17px] text-[9px]`
- **Sheet:** `side="right"`, `w-full sm:max-w-md`, `p-0` custom layout
- **Unread row:** `bg-primary/5`, bold title, primary-tinted icon circle
- **Read row:** muted circle with check icon
- **Manager priority card:** amber bordered CTA at top of sheet for pending approvals
- **Toast:** Sonner (`ui/sonner.tsx`) for action feedback

---

## 6. Page inventory (UI only)

### MR (field rep) — mobile-first shell

| Route / nav | Layout | Key widgets (mobile / tablet / desktop) | Files |
|-------------|--------|----------------------------------------|-------|
| `/mr/dashboard` — Home | 1-col, reordered on mobile | Hero → today card → 5-col quick actions → 3-col stat cards → alerts → targets 1/2 col | `pages/mr/Dashboard.tsx`, `MrDashboardTodayPanel` |
| `/mr/master-list` — Doctors | 1-col, max-w-2xl→4xl | Coverage bar → area pager → searchable scroll list → drawer detail | `pages/mr/MasterList.tsx`, `DoctorMasterDrawer.tsx` |
| `/mr/visit-frequency` — Visits | 1-col dashboard width | Charts + filters | `pages/mr/VisitFrequency.tsx` |
| `/mr/analytics` — Performance | 1-col widening | Metrics grid, radial, 2-col mini stats, period chips, bar charts | `pages/mr/Analytics.tsx` |
| `/mr/report/history` — History | List + header back | Card list of reports | `pages/mr/ReportHistory.tsx` |
| `/mr/report/new` | Multi-step form | Stepper panels | `pages/mr/NewReport.tsx` |
| `/mr/report/:id` | Detail | Read-only report sections | `pages/mr/ReportDetail.tsx` |
| `/mr/leave`, `/mr/expense`, `/mr/tour-program` | Form/list hybrids | PageHeader + panels | respective `pages/mr/*.tsx` |

### Manager — same shell as MR

| Route / nav | Layout | Key widgets | Files |
|-------------|--------|-------------|-------|
| `/manager/dashboard` — Home | 1-col | Hero, team stats, quick actions grid (3–6 cols responsive), leaderboard | `pages/manager/Dashboard.tsx` |
| `/manager/team` — Team | 1-col + drawer | Search, team list cards, charts, manage drawer | `pages/manager/TeamHub.tsx` |
| `/manager/team/:mrId` | Detail tabs | Tabbed MR inspection | `pages/manager/TeamMrDetail.tsx` |
| `/manager/analytics` — Performance | 1-col | Charts, date filters, comparison | `pages/manager/Analytics.tsx` |
| `/manager/reports` | List | Report cards | `pages/manager/Reports.tsx` |
| `/manager/history` | List | History cards | `pages/manager/ManagerHistory.tsx` |
| `/manager/requests` | Approval list | Request cards (not in bottom nav) | `pages/manager/UnlockRequests.tsx` |

### Admin — sidebar shell

| Route / nav | Layout | Key widgets | Files |
|-------------|--------|-------------|-------|
| `/admin/dashboard` | Sidebar + fluid main | 2-col stat cards, radial metrics, 2→4 quick actions, activity feed | `pages/admin/Dashboard.tsx` |
| `/admin/users` | Sidebar + list | Tab buttons, chip filters, card list, dialogs | `pages/admin/Users.tsx` |
| `/admin/doctors` | Sidebar + list | Select filters, search, virtualized cards, pagination | `pages/admin/Doctors.tsx` |
| `/admin/areas` | Sidebar + list | Territory management cards | `pages/admin/Areas.tsx` |
| `/admin/mr-access` | Sidebar + forms | Access configuration | `pages/admin/MRAccess.tsx` |
| `/admin/targets`, `/admin/holidays` | Sidebar + tables/lists | Admin CRUD panels | respective pages |

### Shared

| Route | Layout | Files |
|-------|--------|-------|
| `/profile` | Back header + bottom nav | `pages/profile/Profile.tsx` |
| `/login` | Centered card (glass on md+) | `pages/auth/Login.tsx` |

---

## 7. Role-based differences (UI only)

| Aspect | MR | Manager | Admin |
|--------|-----|---------|-------|
| Primary shell | PageHeader + BottomNav | Same | AdminLayout sidebar (+ mobile drawer + bottom nav) |
| Dashboard density | Highest — 5-col quick actions, many reorder sections | Team-centric stats + wider quick action grid | Stat overview + quick actions 2×2→4 |
| Nav items | Field workflow focused | Team + reports | Directory CRUD |
| Notifications | Bell in header | Bell + approval banner in sheet | None in header |
| List patterns | Drawer for edit | Drawer for team manage | Dialog for create/edit |
| Content max-width | `dashboardPageClass()` | Same | Full width in admin main (no max-w wrapper) |
| Desktop sidebar | None | None | Persistent 240px |

---

## 8. Accessibility & touch

| Concern | Implementation |
|---------|----------------|
| **Minimum tap targets** | Utility `.touch-target` → `min-h-[44px] min-w-[44px]` on primary actions, login inputs, profile buttons |
| **Touch manipulation** | `touch-manipulation` on header buttons; `active:scale-95` feedback |
| **Focus rings** | shadcn default: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on Button, inputs use `focus:ring-2 focus:ring-ring` |
| **Safe areas** | `env(safe-area-inset-top)` on PageHeader; `env(safe-area-inset-bottom)` on BottomNav |
| **ARIA** | Back button `aria-label="Go back"`; notification bell dynamic label with count |
| **Contrast** | Light mode foreground on background is dark-on-light; primary blue on white for buttons; muted text at ~46% lightness — verify for WCAG on small captions |
| **Reduced motion** | **Not implemented** — framer-motion animations on activity rings; CSS `animate-fade-in-up`, `slide-in-left` always run |
| **Screen reader** | Sheet close has `sr-only`; chart rings have `aria-label` |

---

## 9. Mapping notes for Ellure NexHire (destination)

Given Ellure's **`portal-dashboard--admin|client|applicant`** roles and brand primary ~`#0560C7`:

### Admin (applicants DB, resume search, folders, jobs, messages, reports, users)

| Ellure area | Borrow from MakTree |
|-------------|---------------------|
| Dashboard home | Admin dashboard pattern: 2-col stat link cards + radial/secondary metrics + 4-up quick actions |
| Users / applicants DB | Admin card list rows with initials avatar + chip role filters (not data tables) |
| Resume search | Admin header search styling + debounced input with icon; results as virtualized cards |
| Folders | Master list pattern: coverage progress header + grouped scroll list |
| Jobs | Card list + dialog create/edit (`max-w-[360px] rounded-xl`) |
| Messages | Notification **sheet** layout (right slide-over list) — build thread UI separately |
| Reports | Analytics page: date preset toolbar + chart cards in `dashboardPageClass` width |
| Dense desktop | Adopt admin `lg:pl-60` sidebar; keep Ellure primary color in token slots |

### Client (candidates, jobs, messages, subscription)

| Ellure area | Borrow from MakTree |
|-------------|---------------------|
| Home dashboard | Manager welcome hero + team overview panel + 2-col KPI mini cards |
| Candidates | MR master list: searchable panel, section headers, row chevrons |
| Jobs | Stat link cards linking to job lists |
| Messages | Same sheet pattern as admin notifications |
| Subscription | Profile-style `InfoRow` glass card for plan details |
| Navigation | 5-item bottom nav on mobile if routes fit; otherwise 4 + "More" (MakTree doesn't have More — Ellure may need it) |

### Applicant (home, jobs, applications, saved jobs, alerts, messages, profile)

| Ellure area | Borrow from MakTree |
|-------------|---------------------|
| Home | MR dashboard hero + stat cards (3-col) + reminder alert cards |
| Jobs / saved jobs | Card list with `active:scale-[0.98]` tap feedback |
| Applications | Report history list pattern — status tinted borders |
| Alerts | Amber/destructive alert panels from MR dashboard reminders |
| Profile | `ProfileSummaryCard` + completion bar + theme selector grid |
| Mobile nav | MR bottom nav visual style (glass, top indicator bar) |

### Cross-cutting for Ellure

- Reuse **`dashboardPanelClass` / `dashboardPageClass`** spacing philosophy inside existing `PortalDashboardLayout`
- Map **`portal-theme` localStorage** to same light/dark class strategy as `useTheme.tsx`
- **Do not** import MakTree copy, 5-column micro-action grids without sizing adjustments, or decorative search
- **Keep** Ellure marketing site locked; apply patterns only inside portal layout wrappers

---

## 10. File index

| Pattern | Primary file path(s) | Note |
|---------|---------------------|------|
| Design tokens / glass | `src/index.css` | CSS variables, utilities |
| Tailwind theme extension | `tailwind.config.ts` | Colors, fonts, animations |
| Theme provider | `src/hooks/useTheme.tsx` | light/dark/system |
| Dashboard spacing helpers | `src/components/dashboard/dashboard-shell.tsx` | Page/panel/section/grid classes |
| Admin app shell | `src/components/admin/AdminLayout.tsx` | Sidebar + header |
| Mobile bottom nav | `src/components/shared/BottomNav.tsx` | Role-based 5 items |
| Sticky page header | `src/components/shared/PageHeader.tsx` | Glass, safe-area |
| Stat KPI cards | `src/components/dashboard/dashboard-stat-link-cards.tsx` | Linked metrics |
| Radial metrics | `src/components/dashboard/dashboard-radial-metrics.tsx` | Recharts radial |
| Glass section wrapper | `src/components/shared/DashboardSection.tsx` | Icon + title card |
| Quick action tile | `src/components/manager/ManagerQuickAction.tsx` | Grid tile |
| Stat card (simple) | `src/components/shared/StatCard.tsx` | Icon + value |
| Profile hero card | `src/components/dashboard/profile-summary-card.tsx` | Completion bar |
| Empty state | `src/components/shared/EmptyState.tsx` | Inbox icon |
| Loading | `src/components/shared/LoadingSpinner.tsx` | Centered spinner |
| Skeleton | `src/components/ui/skeleton.tsx` | Pulse blocks |
| Notifications sheet | `src/components/shared/NotificationBell.tsx` | Bell + Sheet |
| Filter toolbar | `src/components/ui/action-toolbar.tsx` | Segmented control |
| Date range filter | `src/components/analytics/analytics-date-range-picker.tsx` | Presets + calendar |
| Chart theming | `src/components/charts/analyticsChartTheme.ts` | Tooltip styles |
| Leaderboard | `src/components/ui/leaderboard-card.tsx` | Podium + list |
| Virtualized list | `src/components/shared/VirtualizedScrollList.tsx` | Long admin lists |
| shadcn Button | `src/components/ui/button.tsx` | Variants/sizes |
| shadcn Card | `src/components/ui/card.tsx` | Base card |
| shadcn Dialog | `src/components/ui/dialog.tsx` | Modal forms |
| shadcn Sheet | `src/components/ui/sheet.tsx` | Drawers |
| shadcn Table | `src/components/ui/table.tsx` | Available but unused in pages |
| Mobile hook | `src/hooks/use-mobile.tsx` | 768px breakpoint |
| MR dashboard reference | `src/pages/mr/Dashboard.tsx` | Richest mobile layout |
| Admin dashboard reference | `src/pages/admin/Dashboard.tsx` | Desktop admin home |
| Admin list reference | `src/pages/admin/Users.tsx`, `src/pages/admin/Doctors.tsx` | Filters + cards |
| MR list reference | `src/pages/mr/MasterList.tsx` | Search + grouped cards |
| Profile / settings UI | `src/pages/profile/Profile.tsx` | Theme, edit, info rows |
| Routes inventory | `src/App.tsx` | All portal routes |

---

## 11. Optional: CSS / Tailwind snippets

Generic reusable patterns extracted from this codebase (no business-specific names):

### Panel card

```css
/* Equivalent to dashboardPanelClass() */
.rounded-2xl.border.border-border/80.bg-card.text-card-foreground.shadow-sm
```

### Page container

```css
/* Equivalent to dashboardPageClass() */
.mx-auto.w-full.px-4.py-5.space-y-5.max-w-lg
.md:px-8.md:py-6.md:max-w-3xl.md:space-y-6
.lg:px-10.lg:max-w-5xl.lg:space-y-6
.xl:max-w-6xl
```

### Glass header

```css
.glass /* from index.css — backdrop blur + semi-transparent bg */
.flex.items-center.gap-3.px-4.md:px-8.lg:px-10
.sticky.top-0.z-30.shrink-0.border-b.border-border/40
```

### Touch target utility

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Active nav link (sidebar)

```css
/* Active */
.flex.items-center.gap-3.rounded-lg.px-3.py-2.5.text-sm.font-medium
.bg-primary/10.text-primary

/* Inactive */
.text-muted-foreground.hover:bg-muted.hover:text-foreground
```

### Bottom nav active item

```css
.relative.flex.flex-1.flex-col.items-center.justify-center
.gap-[3px].pt-2.pb-1.5.text-[10px].md:text-[11px].font-semibold
.text-primary /* active */
/* Active indicator: */
.absolute.top-0.left-1/2.-translate-x-1/2.h-[2.5px].w-5.rounded-full.bg-primary
```

### Filter chip

```css
.rounded-full.px-3.py-1.5.text-xs.font-medium.border.whitespace-nowrap
/* Active */ .bg-primary.text-primary-foreground.border-primary
/* Inactive */ .bg-card.text-foreground.border-border
```

### List row card

```css
.flex.items-center.gap-3.rounded-xl.p-4.shadow-sm.bg-card
/* Alternate */ .bg-card/80
```

### Section title utility

```css
.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--muted-foreground));
}
```

### Semantic alert panel

```css
.rounded-2xl.p-4.flex.items-start.gap-3.border
.border-amber-500/30.bg-amber-500/5   /* warning */
.border-destructive/30.bg-destructive/5 /* error */
.border-emerald-500/30.bg-emerald-500/5  /* success */
```

### Primary button (portal convention)

```css
.rounded-lg.bg-primary.text-primary-foreground.hover:bg-primary/90.font-semibold
/* Large touch */ .touch-target
```

### Focus ring (shadcn default)

```css
focus-visible:outline-none
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Fade-in entrance

```css
.animate-fade-in-up
/* keyframes: opacity 0→1, translateY 16px→0, 0.5s cubic-bezier(0.16, 1, 0.3, 1) */
```

---

*End of export. No source files were modified except this document.*
