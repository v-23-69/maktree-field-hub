# MR & Manager dashboard UI/UX export (full layout spec)

> Source: MakTree Medicines Portal (maktree-field-hub)
> Generated: 2026-06-03
> Purpose: Pixel-faithful layout clone for Ellure NexHire (applicant ≈ MR, client ≈ Manager, admin ≈ hybrid)

## 0. How to read this doc

Ellure will clone **structure and style**, not MakTree features. Every section cites `file/path.tsx`. Tailwind classes are copied verbatim from source. **Admin shell** (`/admin/*`) is excluded except one contrast note — MR and Manager share the same mobile shell: `PageHeader` + `dashboardPageClass()` + fixed `BottomNav` + `pb-24` clearance.

Login (`/login`) uses a centered form with `md:glass-card md:p-8 md:rounded-2xl` — not part of the dashboard shell.

---

## 1. Global design system (MR/Manager)

### 1.1 Colors (light + dark)

Values from `src/index.css` (HSL components without `hsl()` wrapper unless noted).

| Token | Light HSL | Light approx hex | Dark HSL | Usage |
|-------|-----------|------------------|----------|-------|
| `--background` | `210 17% 97%` | `#F5F6F8` | `224 20% 8%` | Page canvas `bg-background` |
| `--foreground` | `220 20% 14%` | `#1C2333` | `210 20% 92%` | Body text |
| `--card` | `0 0% 100%` | `#FFFFFF` | `224 18% 11%` | Panels |
| `--primary` | `221 83% 53%` | `#2563EB` | `221 70% 60%` | Nav active, CTAs, rings |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | same | Text on primary |
| `--muted` | `220 14% 96%` | `#F3F4F6` | `220 14% 16%` | Progress tracks, skeleton |
| `--muted-foreground` | `220 9% 46%` | `#6B7280` | `215 12% 55%` | Captions |
| `--destructive` | `0 84% 60%` | `#EF4444` | `0 72% 55%` | Errors, strike |
| `--border` | `214 20% 90%` | `#E2E8F0` | `220 12% 18%` | Card borders |
| `--ring` | `221 83% 53%` | `#2563EB` | `221 70% 60%` | Focus rings |
| `--radius` | `0.75rem` (12px) | — | — | Base radius |
| `--glass-bg` | `rgba(255,255,255,0.72)` | — | `rgba(18,22,30,0.75)` | Header/nav frost |
| `--glass-border` | `rgba(255,255,255,0.45)` | — | `rgba(255,255,255,0.08)` | Glass edge |
| `--glass-shadow` | `0 2px 16px rgba(0,0,0,0.04)` | — | `0 2px 20px rgba(0,0,0,0.25)` | Glass elevation |

Semantic Tailwind (not CSS vars): `emerald-500/600`, `amber-500/600`, `sky-500/600`, `violet-500/600`, `rose-500`, `indigo-500` for status tiles and request badges.

Theme: `src/hooks/useTheme.tsx` — `localStorage` key `maktree-theme`; class on `<html>`.

### 1.2 Typography scale

| Role | Classes | File reference |
|------|---------|----------------|
| Body | `font-sans`, 16px, `letter-spacing: -0.011em` | `src/index.css` |
| Page title (back) | `text-[15px] font-bold tracking-tight truncate` | `PageHeader.tsx` |
| Section title | `text-sm md:text-base font-semibold tracking-tight` | `dashboard-shell.tsx` → `DashboardSection` |
| Hero greeting | `text-lg font-extrabold tracking-tight truncate` | MR/Manager `Dashboard.tsx` |
| Stat value (desktop) | `text-2xl md:text-3xl font-semibold tabular-nums` | `dashboard-stat-link-cards.tsx` |
| Stat value (mobile 3-col) | `max-md:text-lg` | same |
| Stat label (mobile) | `max-md:text-[9px] max-md:leading-tight` | same |
| Quick action label (MR) | `text-[9px] font-semibold leading-tight` | `mr/Dashboard.tsx` |
| Quick action label (Manager) | `text-[10px] md:text-xs font-semibold` | `ManagerQuickAction.tsx` |
| Bottom nav label | `text-[10px] md:text-[11px] font-semibold tracking-wide` | `BottomNav.tsx` |
| Section micro label | `.section-title`: `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` | `index.css` |

Fonts: **Inter** (sans), **Sora** (brand/login only) — `tailwind.config.ts`.

### 1.3 Spacing, radius, shadow, glass

| Pattern | Exact classes |
|---------|---------------|
| Panel | `rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm` | `dashboardPanelClass()` |
| Glass card utility | `rounded-2xl` + CSS vars via `.glass-card` | `index.css` |
| Card hover/tap | `active:scale-95 transition-all` or `active:scale-[0.98]` | dashboards |
| Avatar hero | `h-12 w-12 rounded-full ring-[3px] ring-primary/15 shadow` | MR/Manager home |
| Avatar header | `h-9 w-9 rounded-full ring-2 ring-foreground/[0.06]` | `PageHeader.tsx` |
| Progress bar | `h-2 rounded-full bg-muted overflow-hidden` | targets, profile |
| Alert panel | `rounded-2xl p-4 border border-{semantic}/30 bg-{semantic}/5` | dashboards |

### 1.4 Icons (sizes per context)

Library: **lucide-react**.

| Context | Size classes |
|---------|--------------|
| Bottom nav | `h-5 w-5 md:h-6 md:w-6`; active `stroke-[2.5]` |
| PageHeader back | `h-5 w-5` in `h-10 w-10` button |
| Notification bell | `h-5 w-5` in `h-10 w-10` button |
| MR quick action icon | `h-3.5 w-3.5` in `h-8 w-8 rounded-xl` box |
| Manager quick action icon | `h-4 w-4 md:h-5 md:w-5` in `h-9 w-9 md:h-11 md:w-11` box |
| List row avatar icon area | `h-11 w-11 rounded-full` | `MasterList.tsx` `DoctorRow` |
| Empty state | `Inbox h-8 w-8` in `h-16 w-16 rounded-2xl bg-muted` | `EmptyState.tsx` |

### 1.5 Motion / animation classes

From `tailwind.config.ts`:

| Class | Effect |
|-------|--------|
| `animate-fade-in-up` | opacity 0→1, translateY 16px→0, 0.5s cubic-bezier(0.16,1,0.3,1) |
| `animate-fade-in` | translateY 8px→0, 0.3s |
| `animate-slide-in-left` | drawer (admin only) |
| `transition-colors`, `transition-all`, `transition-transform` | nav, buttons |
| `active:scale-95` / `active:scale-90` | tap feedback |
| Profile completion bar | `transition-all duration-700 ease-out` | `profile-summary-card.tsx` |
| Activity rings | framer-motion (optional on MR analytics) | `activity-rings-card.tsx` |

**No `prefers-reduced-motion` handling** in MR/Manager pages.

---

## 2. App shell (MR & Manager identical shell)

### 2.1 PageHeader — anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ [safe-area-top]                                             │
│ ┌──────┐  ┌─────────────────────────┐  ┌────┐ ┌──────────┐ │
│ │ ←    │  │ MaktreeBrand OR title   │  │ 🔔 │ │ avatar   │ │
│ │10×10 │  │ (flex-1 min-w-0)        │  │10×10│ │ 9×9     │ │
│ └──────┘  └─────────────────────────┘  └────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
  sticky z-30 glass border-b border-border/40
  px-4 md:px-8 lg:px-10
  minHeight: calc(4rem + env(safe-area-inset-top))
```

**File:** `src/components/shared/PageHeader.tsx`

| Mode | Left | Center | Right |
|------|------|--------|-------|
| **Home** (`showBack` false) | — | `MaktreeBrand variant="compact"` | Bell (MR/manager) + profile |
| **Inner** (`showBack` true) | `ArrowLeft` button `h-10 w-10 rounded-xl hover:bg-foreground/5 active:scale-95 touch-manipulation` | `h1` title | Same |

**Avatar (header):**
- Photo: `h-9 w-9 rounded-full object-cover ring-2 ring-foreground/[0.06]`
- Fallback: `h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-foreground/[0.04]` + `text-xs font-bold text-primary` initials

**NotificationBell:** `src/components/shared/NotificationBell.tsx` — opens right `Sheet` `sm:max-w-md`.

### 2.2 BottomNav — anatomy

**File:** `src/components/shared/BottomNav.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ ▬▬▬  (active: h-[2.5px] w-5 rounded-full bg-primary)        │
│  🏠    📋    🎯    📊    🕐                                  │
│ Home  ...   ...  Perf  Hist                                 │
│ text-[10px] md:text-[11px] font-semibold                    │
└─────────────────────────────────────────────────────────────┘
  fixed bottom-0 z-40 glass border-t
  paddingBottom: env(safe-area-inset-bottom)
  inner: max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto md:px-4
```

| Role | # | Route | Icon | Label | exact match? |
|------|---|-------|------|-------|--------------|
| **MR** | 1 | `/mr/dashboard` | `Home` | Home | no |
| MR | 2 | `/mr/master-list` | `List` | Doctors | no |
| MR | 3 | `/mr/visit-frequency` | `Target` | Visits | no |
| MR | 4 | `/mr/analytics` | `BarChart3` | Performance | no |
| MR | 5 | `/mr/report/history` | `History` | History | no |
| **Manager** | 1 | `/manager/dashboard` | `Home` | Home | no |
| Manager | 2 | `/manager/team` | `Users` | Team | no |
| Manager | 3 | `/manager/analytics` | `BarChart3` | Performance | no |
| Manager | 4 | `/manager/reports` | `FileText` | Reports | no |
| Manager | 5 | `/manager/history` | `History` | History | **yes** (`exact: true`) |

**Active:** `text-primary` + top bar + thicker icon stroke. **Inactive:** `text-muted-foreground/70`.

### 2.3 dashboardPageClass() — full string

**File:** `src/components/dashboard/dashboard-shell.tsx`

```
mx-auto w-full px-4 py-5 space-y-5
max-w-lg
md:px-8 md:py-6 md:max-w-3xl md:space-y-6
lg:px-10 lg:max-w-5xl lg:space-y-6
xl:max-w-6xl
```

| Breakpoint | Max width | Horizontal padding | Vertical gap |
|------------|-----------|-------------------|--------------|
| default (<768px) | 512px (`max-w-lg`) | 16px | 20px (`space-y-5`) |
| md (≥768px) | 768px (`max-w-3xl`) | 32px | 24px |
| lg (≥1024px) | 1024px (`max-w-5xl`) | 40px | 24px |
| xl (≥1280px) | 1152px (`max-w-6xl`) | 40px | 24px |

Helpers: `dashboardTablet2Col` → `grid-cols-1 md:grid-cols-2`; `dashboardTablet3Col` → `1 / md:2 / lg:3`.

### 2.4 dashboardPanelClass() / DashboardSection / glass-card

**dashboardPanelClass():**
`rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm`

**DashboardSection** (`dashboard-shell.tsx`):
- Wrapper: `space-y-3 md:space-y-4`
- Title: `text-sm md:text-base font-semibold text-foreground tracking-tight`
- Description: `text-xs md:text-sm text-muted-foreground mt-0.5`

**glass-card** (`index.css`): `rounded-2xl`, blur 16px, uses `--glass-bg/border/shadow`.

**shared/DashboardSection.tsx** (glass variant): `glass-card !rounded-2xl p-4 space-y-3` with optional icon tile `h-9 w-9 rounded-xl bg-primary/10`.

### 2.5 Content padding bottom (bottom nav clearance)

| Page type | Bottom padding class |
|-----------|---------------------|
| Most MR/Manager pages | `pb-24` (96px) on root `min-h-screen bg-background` |
| New report wizard | `pb-20` on some states; step content `pb-28 md:pb-32` when docked footer |
| DCR import (manager) | `pb-28` |
| Profile | `pb-24` |

Bottom nav is **always visible** on MR/Manager (no `lg:hidden`).

---

## 3. MR dashboard — page by page

Routes from `src/App.tsx` (MR only).

---

### 3.1 MR Home — `/mr/dashboard`

- **Nav label:** Home (bottom nav)
- **Header mode:** home brand (no back)
- **Files:** `src/pages/mr/Dashboard.tsx`, `MrDashboardTodayCard.tsx`, `DashboardTodayCard.tsx`, `dashboard-stat-link-cards.tsx`, `DashboardBirthdaySlot.tsx`, `DashboardWelcomeSplash.tsx`

#### Mobile layout (visual order via `max-md:order-[n]`)

| Order | Section | order class |
|-------|---------|-------------|
| 1 | `PageHeader` (brand) | — |
| 2 | Birthday slot | `max-md:order-[5]` |
| 3 | Welcome hero | `max-md:order-[10]` |
| 4 | TP deadline alert (conditional) | `max-md:order-[15]` |
| 5 | **Today panel** (`MrDashboardTodayCard`) | `max-md:order-[20]` |
| 6 | Quick actions + strike/holiday counters | `max-md:order-[30]` |
| 7 | Overview stat cards (3-col) | `max-md:order-[40]` |
| 8 | Sunday DCR / leave banners / holiday notice / reminders / targets | `max-md:order-[60]`–`[70]` |
| 9 | `BottomNav` | fixed |

**DOM order differs from visual order on mobile** — parent uses `max-md:flex max-md:flex-col`.

#### Tablet layout

- Same section order as DOM (no reorder) unless flex-col only applies `max-md`
- Stat grid: still `max-md:!grid-cols-3` only below md; at md+ uses `sm:grid-cols-2 lg:grid-cols-3`
- Targets: `md:grid md:grid-cols-2 md:gap-3`

#### Desktop layout

- `dashboardPageClass()` → up to `max-w-5xl` / `xl:max-w-6xl`
- Single column stack with wider canvas

#### ASCII wireframe (mobile)

```
┌─────────────────────────┐
│ [Brand]      🔔  (av)   │  PageHeader
├─────────────────────────┤
│ 🎂 Birthday (optional)  │
│ ┌─────────────────────┐ │
│ │ (av) Hi, Name!      │ │  hero gradient panel
│ │ 📅 date · time      │ │
│ └─────────────────────┘ │
│ ⚠ TP deadline (opt)     │
│ ┌─ TODAY ─────────────┐ │
│ │ DCR / Expense rows  │ │  DashboardTodayCard
│ │ [Start DCR]         │ │
│ └─────────────────────┘ │
│ [Tour][Exp][⚡][🌴][☂] │  5-col quick actions
│ strikes │ holidays      │  2 mini stat strips
│ ┌───┬───┬───┐           │
│ │KPI│KPI│KPI│           │  3 stat link cards
│ └───┴───┴───┘           │
│ Reminders… Targets…     │
├─────────────────────────┤
│ Home Doc Vis Perf Hist  │  BottomNav
└─────────────────────────┘
```

#### Welcome hero classes

`dashboardPanelClass()` + `bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/15 p-5 animate-fade-in-up`

**Avatar (hero):** `h-12 w-12 rounded-full` — photo with `ring-[3px] ring-primary/15 shadow` OR fallback `bg-primary/15` + `text-base font-extrabold text-primary` initials.

#### Quick actions grid

| Breakpoint | Columns | Tile classes |
|------------|---------|--------------|
| all | **5** (`grid-cols-5 gap-2`) | `dashboardPanelClass()` + `flex flex-col items-center gap-1.5 p-2.5 active:scale-95` |
| Icon box | — | `h-8 w-8 rounded-xl bg-{tint}/10` |
| Icon | — | `h-3.5 w-3.5` |
| Label | — | `text-[9px] font-semibold text-foreground text-center leading-tight` |

Strike tile: `border-destructive/20`, destructive icon/text.

#### Stat cards (`DashboardStatLinkCards columns={3}`)

| Breakpoint | Grid |
|------------|------|
| mobile | `max-md:!grid-cols-3 max-md:gap-2` |
| sm+ | `sm:grid-cols-2` |
| lg+ | `lg:grid-cols-3` |

Value: `text-2xl md:text-3xl max-md:text-lg`. Footer link: desktop text / mobile `ChevronRight h-5 w-5` only.

#### Today panel

`DashboardTodayCard` — `glass-card overflow-hidden`; header strip `px-3.5 py-3 border-b border-primary/10 bg-primary/[0.04]`; status icons `h-5 w-5 rounded-full` with semantic rings.

#### Drawers

Strike/Holiday: `Drawer` bottom sheet `max-h-[85dvh] rounded-t-2xl`; header `text-[15px] font-bold`; primary/destructive full-width `h-12 rounded-xl` buttons.

#### Alternate home states (same shell)

- **Paused:** centered `Lock h-10 w-10` in `h-20 w-20 rounded-full bg-destructive/10`
- **Loading TP:** `DashboardWelcomeSplash` + bottom nav
- **No areas / TP gate:** simplified hero + amber gate card `border-2 border-amber-500/30 bg-amber-500/5`

---

### 3.2 Doctors list — `/mr/master-list`

- **Nav label:** Doctors
- **Header mode:** home brand (`PageHeader title="Doctors"` — no showBack in file)
- **Files:** `src/pages/mr/MasterList.tsx`, `DoctorMasterDrawer.tsx`, `AreaSelectPager.tsx`

#### Mobile layout (top → bottom)

1. PageHeader
2. Master list coverage bar (`rounded-2xl border border-border/80 px-4 py-3 shadow-sm`)
3. `AreaSelectPager` (horizontal territory tabs)
4. Selected area panel (`min-h-[320px]` card with header `bg-muted/30`, progress `h-2`, search input)
5. Grouped doctor list (pending / incomplete / complete)
6. Load more button (if paginated)
7. Sticky footer CTA `Add doctor` `h-11 rounded-xl`
8. `DoctorMasterDrawer` (sheet)
9. BottomNav

**Container:** `px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-4xl mx-auto` (not full `dashboardPageClass`).

#### Tablet / desktop

- Max width grows to `lg:max-w-4xl`
- List scroll area `max-h-[min(50vh,400px)]`

#### Search

`Input pl-9 h-10 rounded-xl bg-background border-border/80` with `Search h-4 w-4` at `left-3`.

#### List row (`DoctorRow`)

`rounded-xl border border-border/70 px-3 py-3 flex gap-3 active:scale-[0.99] touch-manipulation`

- Avatar: `h-11 w-11 rounded-full` — emerald tint if complete, amber if incomplete
- Name: `text-sm font-semibold truncate`
- Badges: `text-[10px]` with `Stethoscope h-3 w-3`

#### Drawer

`DoctorMasterDrawer` — detail/edit slide-over (inspect component for field layout).

---

### 3.3 Performance — `/mr/analytics`

- **Nav label:** Performance
- **Header mode:** home brand (`title="Performance"`)
- **File:** `src/pages/mr/Analytics.tsx`

#### Layout stack

1. Subtitle `text-sm text-muted-foreground -mt-2`
2. `PerformanceMetricsGrid` — `grid grid-cols-2 gap-2 sm:grid-cols-3`, cells `glass-card p-3 rounded-xl`
3. `DashboardRadialMetrics` (1 item ring 72×72px)
4. 2-col mini stats `glass-card p-3 rounded-xl`
5. Field calls section: period chips `text-[10px] px-2 py-1 rounded-lg font-semibold border`
6. `TeamFieldCallsChart` + 3-col summary tiles `rounded-xl bg-muted/40 px-3 py-2.5`
7. Bar charts in `glass-card p-3 rounded-xl`

**Container:** inline duplicate of page class (same breakpoints as `dashboardPageClass`).

#### Period filter chips

Active: `bg-primary text-primary-foreground border-primary`. Inactive: `border-border bg-card text-muted-foreground`.

---

### 3.4 Report history — `/mr/report/history`

- **Nav label:** History
- **Header mode:** back + title (`showBack`)
- **Files:** `src/pages/mr/ReportHistory.tsx`, `src/components/mr/ReportHistoryView.tsx`

**Container:** `px-4 py-4 max-w-lg md:px-8 md:max-w-3xl lg:px-10 lg:max-w-5xl`

List UI delegated to `ReportHistoryView` — card/list pattern with date grouping, status badges, late-request mode.

---

### 3.5 New report — `/mr/report/new` (layout only)

- **Nav label:** none (deep link)
- **Header mode:** back + "New Daily Report"
- **File:** `src/pages/mr/NewReport.tsx`

#### Shell

```
h-[100dvh] overflow-hidden flex flex-col bg-background
├── PageHeader (back)
├── Stepper strip (shrink-0 px-4 md:px-6 max-w-lg md:max-w-2xl lg:max-w-3xl)
│     └── segments h-[5px] rounded-full bg-primary|bg-muted
├── Scroll area flex-1 overflow-y-auto
│     └── step content px-4 md:px-6 max-w-lg md:max-w-2xl lg:max-w-3xl
└── ReportStepFooter (docked) + BottomNav pb-20
```

Steps label: `text-[10px] font-semibold tracking-wide`. Docked footer padding: `pb-28 md:pb-32`.

---

### 3.6 Visit frequency — `/mr/visit-frequency`

- **Nav:** Visits
- **Header:** back
- **File:** `src/pages/mr/VisitFrequency.tsx`
- **Layout:** `dashboardPageClass()` + chart sections from `VisitFrequencyByAreaSection`

---

### 3.7 Leave — `/mr/leave`

- **Nav:** none (quick action)
- **Header:** back + "Leave"
- **File:** `src/pages/mr/Leave.tsx`
- **Layout:** form cards in single column, `pb-24`

---

### 3.8 Expense — `/mr/expense`

- **File:** `src/pages/mr/Expense.tsx`
- **Header:** back
- Form/list panels with `dashboardPanelClass` patterns

---

### 3.9 Tour program — `/mr/tour-program`

- **File:** `src/pages/mr/TourProgram.tsx`
- Calendar/grid style panels, month navigation

---

### 3.10 Report detail — `/mr/report/:id`

- **File:** `src/pages/mr/ReportDetail.tsx`
- **Header:** back + "Daily Report"
- Read-only stacked sections, collapsible visit cards

---

## 4. Manager dashboard — page by page

---

### 4.1 Manager Home — `/manager/dashboard`

- **Nav label:** Home
- **Header mode:** home brand
- **Files:** `src/pages/manager/Dashboard.tsx`, `ManagerQuickAction.tsx`, `ManagerTeamDcrToday.tsx`, `DashboardTodayCard.tsx`, `ActionToolbar.tsx`

#### Mobile layout (order classes)

| order | Section |
|-------|---------|
| `[5]` | Birthday slot |
| `[10]` | Welcome hero |
| `[11]` | Setup banner (no sub-areas) |
| `[12]` | DCR paused banner |
| `[15]` | TP deadline alert |
| `[55]` | Sunday DCR CTA |
| `[20]` | Today card + `ManagerTeamDcrToday` |
| `[30]` | Overview (toolbar + stat cards) |
| `[35]` | Quick actions grid |

**Note:** Manager home does **not** include team leaderboard — that lives on `/manager/team`.

#### Tablet / desktop

- Quick actions: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-3`
- Stat cards: same 3-col behavior as MR
- `ActionToolbar` full width above stats

#### ASCII wireframe (mobile)

```
┌─────────────────────────┐
│ [Brand]           🔔 (av)│
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ (av) Hi, Name!      │ │
│ │ N MRs in your team  │ │
│ └─────────────────────┘ │
│ Today: DCR + team DCR   │
│ [Week|Month|Year] filter│
│ ┌───┬───┬───┐ KPI row   │
│ ┌──┬──┬──┐              │
│ │QA tiles 3-6 cols     │ │  15 quick actions
│ └──┴──┴──┘              │
├─────────────────────────┤
│ Home Team Perf Rep Hist │
└─────────────────────────┘
```

#### Welcome hero

Same classes as MR except subtitle: `text-xs text-muted-foreground font-medium` with MR count (not date line).

#### Quick actions (`managerQuickActionGridClass`)

| Breakpoint | Columns |
|------------|---------|
| default | 3 |
| sm | 4 |
| md | 5 |
| lg | 6 |

Tile: `min-h-[88px] md:min-h-[100px] p-3 md:p-4`, icon box `h-9 w-9 md:h-11 md:w-11 rounded-xl`, label `text-[10px] md:text-xs`. Coming soon: `opacity-75` + `text-[8px] md:text-[9px]`.

#### Overview section

`ActionToolbar` — `rounded-2xl border border-border/80 bg-muted/30 p-1 shadow-sm`; active pill `bg-primary text-primary-foreground shadow-sm h-9 rounded-xl`.

#### Drawer (manager home)

Full viewport height option: `h-[100dvh] max-h-[100dvh] rounded-t-2xl` for assign-self / strike / holiday / add-stockist.

---

### 4.2 Team hub — `/manager/team`

- **Nav label:** Team
- **Header mode:** back + "Team"
- **Files:** `src/pages/manager/TeamHub.tsx`, `TeamPerformanceLeaderboard.tsx`, `TeamHubManageDrawer.tsx`

#### Mobile layout

1. Team overview panel (`p-4`) with 2-col today stats grid
2. `TeamPerformanceLeaderboard` (podium + filters)
3. Team calls chart panel (`dashboardPanelClass p-4`)
4. Monthly support donut section (conditional)
5. Team tools button grid `grid-cols-2 sm:grid-cols-3`
6. Search input `h-10 rounded-xl`
7. MR list rows → navigate to `/manager/team/:mrId`
8. `TeamHubManageDrawer`

#### MR list row

`dashboardPanelClass w-full p-3.5 flex gap-3 active:scale-[0.99]`

- Avatar: `h-10 w-10 rounded-full` — photo OR `bg-primary/10` initials `text-xs font-bold text-primary`
- Meta: `text-[10px] text-muted-foreground` DCR/Exp/TP status
- Trailing: `ChevronRight h-4 w-4` or `Lock` if paused

---

### 4.3 MR detail — `/manager/team/:mrId`

- **Nav:** none (deep)
- **Header:** back + MR full name
- **File:** `src/pages/manager/TeamMrDetail.tsx`

#### Layout

1. `MrProfileCard` — team member hero
2. Horizontal tab strip: `flex gap-1 overflow-x-auto` pills `px-3 py-2 rounded-xl text-[11px] font-semibold border`
   - Active: `bg-primary text-primary-foreground border-primary`
   - Inactive: `bg-card border-border/60 text-muted-foreground`
3. Tab content (Overview, Tour, DCR, MS, Areas, Doctors, Stats)

**Container:** `px-4 md:px-6 py-4 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto`

Tabs: `overview | tp | dcr | support | territories | master | analytics` via `?tab=` query.

---

### 4.4 Analytics — `/manager/analytics`

- **Nav:** Performance
- **Header:** home brand, title "Analytics"
- **File:** `src/pages/manager/Analytics.tsx`

#### Layout stack

1. `AnalyticsDateRangePicker` in `dashboardPanelClass`
2. Tab row: overview | area | loyalty | intel | calls
3. Chart grids lazy-loaded per tab
4. Include-self toggle, MR multi-select patterns
5. Uses `dashboardPageClass('py-4 space-y-4 md:space-y-5')`

---

### 4.5 Reports — `/manager/reports`

- **Nav:** Reports
- **File:** `src/pages/manager/Reports.tsx`

#### Layout

- Tab toggle: reports | expenses
- MR selector, date/mode filters (daily/month)
- Collapsible report cards (`Collapsible` + `ChevronDown`)
- Filter row: speciality, product, area selects
- Dense filter toolbar at top — admin-style complexity in MR shell

---

### 4.6 History — `/manager/history`

- **Nav:** History (exact)
- **File:** `src/pages/manager/ManagerHistory.tsx`

#### Layout

1. Team member label + "Allow late DCR" secondary button `rounded-xl`
2. Horizontal scroll MR chips `rounded-xl border px-3 py-2 min-w-[100px]`
3. `ReportHistoryView` for selected MR

Chip active: `border-primary bg-primary/5 ring-1 ring-primary/20`.

---

### 4.7 Requests — `/manager/requests`

- **Nav:** none (notification deep link)
- **Header:** back (typical)
- **File:** `src/pages/manager/UnlockRequests.tsx`

#### Approval card pattern

- Wrapper: `rounded-xl border p-4 space-y-3` (stacked list)
- `KindBadge`: `Badge variant="outline" text-[10px] font-semibold gap-1` + per-kind color e.g. `bg-indigo-500/10 text-indigo-800 border-indigo-500/30`
- Actions: Approve/Reject `Button size="sm" rounded-lg`
- Reject expands `Textarea` + confirm

---

### 4.8 Other manager routes (summary)

| Route | Header | Layout donor |
|-------|--------|--------------|
| `/manager/targets` | Home title | Form tables in panels |
| `/manager/leaves` | "Leaves & approvals" | Card list + approve actions |
| `/manager/my-leave` | back | MR Leave layout |
| `/manager/holidays` | "Holidays" | List + add form |
| `/manager/territories` | back | Territory assignment lists |
| `/manager/vacant-areas` | back | `dashboardPageClass` + grid cards |
| `/manager/vacant-areas/:areaId` | back | Detail list |
| `/manager/team/visit-frequency` | back | Same as MR visit frequency |
| `/manager/late-dcr-grant` | back | Form + MR picker |
| `/manager/dcr-import/:importId` | back | Import review scroll |
| `/manager/report/new` | back | Shared `NewReport.tsx` |
| `/manager/report/:id` | back | Shared `ReportDetail.tsx` |
| `/manager/expense` | back | Shared expense page |
| `/manager/tour-program` | back | Shared tour program |

---

## 5. Side-by-side: MR home vs Manager home

| UI block | MR home (`/mr/dashboard`) | Manager home (`/manager/dashboard`) | Same or different? |
|----------|---------------------------|-------------------------------------|-------------------|
| Page shell | `pb-24`, brand header, bottom nav | Identical | **Same** |
| Welcome hero | Avatar + first name + **date + IST time** | Avatar + first name + **MR count** | **Different** content |
| Hero classes | `gradient from-primary/10… p-5 animate-fade-in-up` | Same gradient panel classes | **Same** |
| Today panel | `MrDashboardTodayCard` (single user) | `DashboardTodayCard` + `ManagerTeamDcrToday` | **Different** (manager adds team strip) |
| Mobile reorder | Heavy `max-md:order-[n]` | Same technique | **Same** pattern |
| Stat KPI row | 3 cards: DCRs month, doctors week, pending DCRs | 3 cards: DCRs period, doctors met, team MRs | **Different** labels; **same** `DashboardStatLinkCards` component |
| Stat period filter | None on home | `ActionToolbar` Week/Month/Year | **Different** |
| Quick actions grid | **5 cols** fixed, micro labels 9px | **3–6 cols** responsive, 15 tiles, 10–12px labels | **Different** density |
| Quick action icon box | `h-8 w-8` | `h-9 w-9 md:h-11 md:w-11` | **Different** sizes |
| Secondary counters | 2-up strike/holiday strips under QA | Inside holiday drawer / not on home row | **Different** |
| Leaderboard | Not on home | Not on home (on **Team** page) | **Same** (absent) |
| Reminders/targets | Doctor birthday alerts, product targets | Not on home | **MR-only** blocks |
| TP deadline alert | Shared amber/destructive panel classes | Shared | **Same** chrome |
| Drawers | Strike + holiday | Assign self, strike, holiday, add stockist | **Different** set |
| Gate states | Paused, no areas, TP pending | Paused, no areas, DCR blocked | **Similar** layout, different copy |

---

## 6. Profile page (shared MR/Manager)

**File:** `src/pages/profile/Profile.tsx`

**Route:** `/profile` — header **back** mode, bottom nav for role.

#### Layout (top → bottom)

1. `ProfileSummaryCard` (`profile-summary-card.tsx`)
   - Cover: `h-24 bg-gradient-to-br from-primary/15 via-primary/5 to-background`
   - Avatar overlap: `h-20 w-20 rounded-full border-4 border-card shadow-md -mt-10`
   - Upload button: `h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md` + `Camera h-3.5 w-3.5`
   - Role pill: `rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary`
   - Completion bar: `h-2 rounded-full bg-muted` fill `bg-primary transition-all duration-700`
   - Stats grid: `grid grid-cols-2 gap-2.5` cells `rounded-xl bg-muted/40 px-3 py-2.5`

2. Incomplete profile CTA: `rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-xs font-semibold`

3. Info rows: `glass-card !rounded-xl divide-y divide-border/50` — `InfoRow` with icon `h-4 w-4 text-muted-foreground`, label `text-[10px] uppercase tracking-wider`

4. Edit toggle: full-width `Button variant="outline" rounded-xl touch-target`

5. Theme picker: `glass-card p-3.5` → `grid grid-cols-3 gap-2` buttons `rounded-xl py-2.5`; active `bg-primary/10 ring-2 ring-primary/30`

6. Support link row (MR/manager): glass card row with `ChevronRight`

7. Logout: `Button variant="outline" rounded-xl touch-target text-destructive border-destructive/30 hover:bg-destructive/5`

**Container:** `max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-4 px-4 md:px-6 pt-4`

---

## 7. Reusable component catalog

| Component | File | Props/slots | Visual spec | Used on |
|-----------|------|-------------|-------------|---------|
| `PageHeader` | `shared/PageHeader.tsx` | `title`, `showBack`, `onBack`, `rightAction` | Sticky glass, 4rem + safe-area | All MR/Manager pages |
| `BottomNav` | `shared/BottomNav.tsx` | `role: 'mr' \| 'manager'` | Fixed glass, 5 items | All primary pages |
| `dashboardPageClass` | `dashboard/dashboard-shell.tsx` | optional cn merge | Responsive max-width shell | Dashboards, team, analytics |
| `dashboardPanelClass` | same | optional cn | rounded-2xl card chrome | Universal |
| `DashboardSection` | `dashboard-shell.tsx` | `title`, `description`, `action` | Section heading + gap | Home dashboards |
| `DashboardStatLinkCards` | `dashboard-stat-link-cards.tsx` | `items`, `columns` | KPI + footer link | MR/Manager home |
| `DashboardTodayCard` | `shared/DashboardTodayCard.tsx` | DCR/expense props | glass-card status panel | MR/Manager home |
| `ManagerQuickAction` | `manager/ManagerQuickAction.tsx` | `label`, `icon`, `iconClassName` | Large tile | Manager home |
| `StatCard` | `shared/StatCard.tsx` | icon, value, label, color | glass-card KPI | Legacy/alerts |
| `ProfileSummaryCard` | `dashboard/profile-summary-card.tsx` | avatar, completion, stats | Cover + overlap avatar | Profile |
| `EmptyState` | `shared/EmptyState.tsx` | `message`, `action` | Centered inbox icon py-16 | Lists |
| `LoadingSpinner` | `shared/LoadingSpinner.tsx` | — | `Loader2 h-8 w-8 animate-spin text-primary` | Async |
| `NotificationBell` | `shared/NotificationBell.tsx` | `userId`, `role` | Sheet inbox | Header MR/Manager |
| `ActionToolbar` | `ui/action-toolbar.tsx` | `buttons`, `activeId` | Segmented pill bar | Manager home overview |
| `PerformanceMetricsGrid` | `performance/PerformanceMetricsGrid.tsx` | `metrics` | 2→3 col glass cards | MR analytics |
| `TeamPerformanceLeaderboard` | `manager/TeamPerformanceLeaderboard.tsx` | filters, activity | Leaderboard card | Team hub |
| `ReportHistoryView` | `mr/ReportHistoryView.tsx` | subject, linkMode | History list | History pages |

---

## 8. Responsive matrix (MR + Manager)

| Breakpoint | Header px | Main max-width | Quick action cols (MR / Mgr) | Stat grid (3-col mode) | Lists | Bottom nav |
|------------|-----------|----------------|------------------------------|------------------------|-------|------------|
| **<768px** | px-4 | max-w-lg (512px) | 5 / 3 | forced 3-col, tiny type | Full-width cards, scroll chips | 5 icons, text 10px |
| **768–1023px** | px-8 | max-w-3xl (768px) | 5 / 4–5 | 2-col then 3-col at lg | 2-col targets, wider charts | same |
| **≥1024px** | px-10 | max-w-5xl→6xl | 5 / 6 | lg:grid-cols-3 | Virtualized/tall scroll | same (still fixed bottom) |

`useIsMobile`: `<768px` in `src/hooks/use-mobile.tsx`.

---

## 9. Ellure mapping blueprint (for the applying agent)

| MakTree | Ellure role | Ellure routes (features) | Layout donor |
|---------|-------------|--------------------------|--------------|
| MR shell (header + bottom nav + page class) | **Applicant** | All `/dashboard/applicant/*` | `PageHeader` + `BottomNav` + `dashboardPageClass` |
| MR home section order + reorder | **Applicant** | `/dashboard/applicant` home | **`/mr/dashboard`** — hero, KPI 3-col, quick actions, alert panels |
| MR master list | **Applicant** | Saved jobs, job browse lists | **`/mr/master-list`** — coverage header, search, grouped cards, drawer detail |
| MR analytics | **Applicant** | Application stats / profile views | **`/mr/analytics`** — metrics grid + charts + period chips |
| MR report history | **Applicant** | Applications history | **`/mr/report/history`** |
| MR new report stepper | **Applicant** | Multi-step apply form | **`/mr/report/new`** — 100dvh stepper + docked footer |
| Profile page | **Applicant** | Settings / profile | **`/profile`** |
| Manager shell | **Client** | All `/dashboard/client/*` | Same shell components, manager `NAV_ITEMS` |
| Manager home | **Client** | `/dashboard/client` home | **`/manager/dashboard`** — hero with team count, overview toolbar + KPIs, large QA grid |
| Manager team hub | **Client** | Candidates list | **`/manager/team`** — overview stats, search, list rows with avatar |
| Manager team detail tabs | **Client** | Candidate detail | **`/manager/team/:mrId`** — profile card + horizontal tabs |
| Manager analytics | **Client** | Hiring analytics | **`/manager/analytics`** |
| Manager reports | **Client** | Job pipelines / exports | **`/manager/reports`** — filters + collapsible cards |
| Manager history | **Client** | Activity log | **`/manager/history`** — horizontal person chips + list |
| Manager requests | **Client** | Pending approvals (if any) | **`/manager/requests`** — kind badges + approve/reject cards |
| Notification sheet | **Client + Applicant** | Messages inbox list | **`NotificationBell.tsx`** sheet pattern (not chat bubbles) |
| MR list + Manager team + admin density | **Admin** | `/dashboard/admin` home | **Hybrid:** Manager overview toolbar + MR stat cards + admin-style lists from team hub |
| Admin list/search (contrast only) | **Admin** | Resume search, users | Card rows like **`/manager/team`** + search from **`/mr/master-list`** |
| Admin detail tabs | **Admin** | Applicant detail | **`/manager/team/:mrId`** tab strip |
| Admin analytics | **Admin** | Reports | **`/manager/analytics`** date picker + tabs |
| Admin folders | **Admin** | Folders | **`/mr/master-list`** area pager + grouped list |

**Ellure brand note:** Keep primary ~`#0560C7` / teal secondary — map onto `--primary` slots, preserve layout geometry from this doc.

**Do not clone:** MR 5-column micro quick actions without widening labels; admin sidebar (use hybrid only where Ellure admin already has sidebar).

---

## 10. Tailwind/CSS clone kit

### Page wrapper (MR/Manager)

```html
<div class="min-h-screen bg-background pb-24">
  <!-- PageHeader -->
  <div class="mx-auto w-full px-4 py-5 space-y-5 max-w-lg md:px-8 md:py-6 md:max-w-3xl md:space-y-6 lg:px-10 lg:max-w-5xl lg:space-y-6 xl:max-w-6xl">
    ...
  </div>
  <!-- BottomNav -->
</div>
```

### Panel card

```
rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm
```

### Stat link card (KPI)

```
grid gap-3 md:gap-4 max-md:!grid-cols-3 max-md:gap-2
/* card inner */ p-4 md:p-5 max-md:p-2.5 max-md:pb-2
/* value */ text-2xl md:text-3xl max-md:text-lg font-semibold tabular-nums tracking-tight
/* footer link mobile */ ChevronRight h-5 w-5 mx-auto text-primary
```

### List row

```
flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-3
active:scale-[0.99] transition-all touch-manipulation
/* avatar */ h-11 w-11 rounded-full
```

### MR quick action tile

```
grid grid-cols-5 gap-2
/* tile */ rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col items-center gap-1.5 p-2.5 active:scale-95 transition-all
/* icon box */ h-8 w-8 rounded-xl bg-primary/10
/* icon */ h-3.5 w-3.5 text-primary
/* label */ text-[9px] font-semibold text-foreground text-center leading-tight
```

### Manager quick action tile

```
grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-3
/* tile */ ... min-h-[88px] md:min-h-[100px] p-3 md:p-4
/* icon box */ h-9 w-9 md:h-11 md:w-11 rounded-xl
/* label */ text-[10px] md:text-xs font-semibold text-center leading-tight
```

### Welcome hero

```
rounded-2xl border border-border/80 bg-card shadow-sm
bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/15 p-5 animate-fade-in-up
/* avatar */ h-12 w-12 rounded-full ring-[3px] ring-primary/15 shadow object-cover
/* greeting */ text-lg font-extrabold text-foreground tracking-tight truncate
```

### Alert panel (warning)

```
rounded-2xl p-4 flex items-start gap-3 border border-amber-500/30 bg-amber-500/5
/* destructive variant */ border-destructive/30 bg-destructive/5
```

### Filter chip (period)

```
text-[10px] px-2 py-1 rounded-lg font-semibold border transition
/* active */ bg-primary text-primary-foreground border-primary
/* inactive */ border-border bg-card text-muted-foreground
```

### Bottom nav item (active indicator)

```
relative flex flex-1 flex-col items-center justify-center gap-[3px] pt-2 pb-1.5 text-[10px] md:text-[11px] font-semibold text-primary
/* indicator */ absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full bg-primary
```

### Touch target utility

```css
.touch-target { min-height: 44px; min-width: 44px; }
```

---

## 11. File index (all paths touched)

### Shell & tokens
- `src/App.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `src/hooks/useTheme.tsx`
- `src/hooks/use-mobile.tsx`

### Shared shell
- `src/components/shared/PageHeader.tsx`
- `src/components/shared/BottomNav.tsx`
- `src/components/shared/NotificationBell.tsx`
- `src/components/shared/DashboardTodayCard.tsx`
- `src/components/shared/DashboardSection.tsx` (glass variant)
- `src/components/shared/EmptyState.tsx`
- `src/components/shared/LoadingSpinner.tsx`
- `src/components/shared/StatCard.tsx`
- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/dashboard/dashboard-stat-link-cards.tsx`
- `src/components/dashboard/profile-summary-card.tsx`
- `src/components/dashboard/dashboard-radial-metrics.tsx`
- `src/components/ui/action-toolbar.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/drawer.tsx`

### MR pages
- `src/pages/mr/Dashboard.tsx`
- `src/pages/mr/MasterList.tsx`
- `src/pages/mr/Analytics.tsx`
- `src/pages/mr/ReportHistory.tsx`
- `src/pages/mr/NewReport.tsx`
- `src/pages/mr/ReportDetail.tsx`
- `src/pages/mr/VisitFrequency.tsx`
- `src/pages/mr/Leave.tsx`
- `src/pages/mr/Expense.tsx`
- `src/pages/mr/TourProgram.tsx`
- `src/components/mr/MrDashboardTodayCard.tsx`
- `src/components/mr/DoctorMasterDrawer.tsx`
- `src/components/mr/AreaSelectPager.tsx`
- `src/components/mr/ReportHistoryView.tsx`
- `src/components/performance/PerformanceMetricsGrid.tsx`

### Manager pages
- `src/pages/manager/Dashboard.tsx`
- `src/pages/manager/TeamHub.tsx`
- `src/pages/manager/TeamMrDetail.tsx`
- `src/pages/manager/Analytics.tsx`
- `src/pages/manager/Reports.tsx`
- `src/pages/manager/ManagerHistory.tsx`
- `src/pages/manager/UnlockRequests.tsx`
- `src/pages/manager/Targets.tsx`
- `src/pages/manager/Leaves.tsx`
- `src/pages/manager/Holidays.tsx`
- `src/pages/manager/ManagerTerritories.tsx`
- `src/pages/manager/ManagerVacantAreas.tsx`
- `src/pages/manager/TeamVisitFrequency.tsx`
- `src/components/manager/ManagerQuickAction.tsx`
- `src/components/manager/ManagerTeamDcrToday.tsx`
- `src/components/manager/TeamPerformanceLeaderboard.tsx`
- `src/components/manager/team/TeamHubManageDrawer.tsx`
- `src/components/manager/MrProfileCard.tsx`
- `src/components/analytics/analytics-date-range-picker.tsx`

### Profile
- `src/pages/profile/Profile.tsx`

### Not used for Ellure shell (contrast only)
- `src/components/admin/AdminLayout.tsx` — desktop sidebar + hamburger; MR/Manager never use this layout

---

## 12. Screenshots checklist (optional)

Human validation views for a pixel clone:

1. MR home — full happy path (hero + today + 5 QA + 3 KPIs)
2. MR home — mobile reorder visible (today above stats)
3. Manager home — hero + overview toolbar + 6-col QA at lg
4. MR master list — area selected with grouped doctor rows
5. MR analytics — metrics grid + period chips + bar chart
6. Manager team hub — leaderboard + MR list row
7. Manager team MR detail — tab strip + overview tab
8. Manager requests — stacked approval cards with kind badges
9. Profile — cover, overlapping avatar, theme grid
10. Bottom nav — active vs inactive (top primary bar)
11. PageHeader — home brand vs inner back title
12. Notification sheet open (right panel list)

---

*End of export. Only this file was created/modified.*
