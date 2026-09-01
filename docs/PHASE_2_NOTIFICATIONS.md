# Phase 2 — Advanced Notifications (Master Plan)

**Previous phase:** Phase 1 — First run on device ✅ Complete  
**Current phase:** Phase 2 — Notifications (Firebase + full notification system)  
**Next phase:** Phase 3 — App branding & polish

Open this file on one side while you work. Ask the AI in chat when you need help on any step.

---

## What we are building

A **WhatsApp / Instagram–style** notification system:

| Feature | Phase 2A | Phase 2B | Phase 2C |
|---------|----------|----------|----------|
| Push when app is closed | ✅ | | |
| Tap notification → opens exact screen | ✅ | | |
| In-app notification bell (already works) | ✅ | | |
| All important business events notify MR + Manager + Admin | | ✅ | |
| Approve / Reject from notification shade | | | ✅ |
| DCR reminders, birthdays, missed DCR (scheduled) | | ✅ | |

**Important:** Your portal already has a strong notification **foundation** in Supabase (`user_notifications` + `_notify_user`). Phase 2 connects that to **FCM push** on phones and **fills gaps** where notifications don't exist yet.

---

## Architecture (how it works)

```
Business event (DCR submit, leave request, etc.)
        ↓
Supabase RPC calls _notify_user() or _notify_mr_managers()
        ↓
Row inserted in user_notifications
        ↓
DB trigger → Edge Function send-push-notification
        ↓
FCM → Manager/MR phone (even if app closed)
        ↓
Tap notification → opens app on correct page (#/manager/requests?…)
Optional: Approve/Reject buttons → quick action (Phase 2C)
```

**Same UI, same database** — we are not rewriting the portal.

---

## Phase 2 sub-phases

| Sub-phase | Goal | Status |
|-----------|------|--------|
| **2A** | Firebase + FCM + basic push + deep links | ✅ Complete |
| **2B** | Add missing notification triggers + deep link params | ✅ Complete (DB live; rebuild app for UI) |
| **2C** | Rich actions (Approve/Reject from notification panel) | ✅ Complete |
| **2D** | Scheduled reminders (DCR 8PM/11PM, birthdays, missed DCR) | ✅ Complete (enable pg_cron in Supabase if jobs not scheduled) |

Do **2A first** (Firebase setup). Then AI implements 2B–2D while you test on your phone.

---

# Part A — Your tasks (Firebase setup)

Follow **`docs/firebase-setup.md`** — summary:

### Checklist

```
[ ] Task A1 — Create Firebase project
[ ] Task A2 — Add Android app (package: com.maktree.sfa)
[ ] Task A3 — Download google-services.json → android/app/
[ ] Task A4 — Firebase service account JSON → Supabase Edge Function secret
[ ] Task A5 — Set PUSH_HOOK_SECRET in Supabase + SQL insert
[ ] Task A6 — Add to .env: VITE_ENABLE_NATIVE_PUSH=true
[ ] Task A7 — npm run build:android → Run on phone
[ ] Task A8 — Test: existing notification (e.g. doctor add request) with app in background
```

When A1–A8 are done, tell the AI: **"Phase 2A done"**

---

# Part B — Complete notification catalog

Below is every notification situation analyzed from the codebase.

**Legend:**
- ✅ **Live** — already creates `user_notifications` row (push will work after Firebase)
- 🟡 **Partial** — works in-app only (client-side), not server push when app closed
- ❌ **Missing** — not implemented yet (AI will add in Phase 2B/2D)

---

## B1 — Manager receives (approvals & team activity)

| # | Event | Recipient | Status | Deep link | Quick actions |
|---|-------|-----------|--------|-----------|---------------|
| M1 | MR submits **new doctor** for approval | Manager(s) | ✅ `doctor_add_request` | `/manager/requests` | Approve / Reject |
| M2 | MR submits **doctor deletion** request | Manager(s) | ❌ Missing | `/manager/requests` | Approve / Reject |
| M3 | MR submits **late DCR** approval request | Manager | ✅ `late_dcr_request` | `/manager/requests` | Approve / Reject |
| M4 | MR submits **leave without pay** | All mapped managers | ✅ `leave_request` | `/manager/leaves` | Approve / Reject |
| M5 | MR submits **DCR** (field report) | All mapped managers | ✅ `dcr_submitted` | `/manager/reports` | View |
| M6 | MR submits **expense report** | Manager(s) | ❌ Missing | `/manager/reports` or expense view | View |
| M7 | MR submits **tour program** for approval | Manager | ❌ Missing | `/manager/requests` | Approve / Reject |
| M8 | MR requests **TP day deletion** | Manager | ❌ Missing | `/manager/requests` | Approve / Reject |
| M9 | MR **blocked** (3 missed DCRs) — unlock request | Manager | ❌ Missing | `/manager/requests` | Approve / Reject |
| M10 | Other manager **resolved leave** (FYI) | Other managers | ✅ `leave_resolved` | `/manager/leaves` | View |
| M11 | **Month-end backup** reminder | Manager | ❌ Missing | `/manager/backup` | Open |
| M12 | Team member **birthday today** | All users / team | ❌ Missing | `/profile` or dashboard | Wish |

---

## B2 — MR receives (results & reminders)

| # | Event | Recipient | Status | Deep link | Quick actions |
|---|-------|-----------|--------|-----------|---------------|
| R1 | Manager **approved doctor add** | MR | ✅ `doctor_add_approved` | `/mr/master-list?…` | Open |
| R2 | Manager **rejected doctor add** | MR | ✅ `doctor_add_rejected` | `/mr/master-list` | Open |
| R3 | Manager **approved/rejected doctor deletion** | MR | ❌ Missing | `/mr/master-list` | Open |
| R4 | Manager **approved late DCR** dates | MR | ✅ `late_dcr_granted` | `/mr/dashboard` | File DCR |
| R5 | Manager **rejected late DCR** request | MR | ✅ `late_dcr_rejected` | `/mr/report/history` | Open |
| R6 | Manager **granted late DCR** directly | MR | ✅ `late_dcr_granted` | `/mr/dashboard` | File DCR |
| R7 | Manager **cleared auto-leave** + opened late DCR | MR | ✅ `late_dcr_granted` | `/mr/dashboard` | File DCR |
| R8 | Manager **approved leave** | MR | ✅ `leave_approved` | `/mr/report/history` | Open |
| R9 | Manager **rejected leave** | MR | ✅ `leave_rejected` | `/mr/report/history` | Open |
| R10 | Manager **updated tour program** (joint planning) | MR | ✅ `tour_program_updated` | `/mr/tour-program` | Open |
| R11 | Manager **approved/rejected TP** | MR | ❌ Missing | `/mr/tour-program` | Open |
| R12 | **Unlock request approved/rejected** | MR | ❌ Missing | `/mr/report/new` | Open |
| R13 | **DCR reminder** — 8 PM IST | MR | 🟡 Client only (`useDcrReminders`) | `/mr/report/new` | File DCR |
| R14 | **DCR reminder** — 11 PM IST (last call) | MR | 🟡 Client only | `/mr/report/new` | File DCR |
| R15 | **Missed DCR** auto-marked leave without pay | MR | ❌ Missing | `/mr/dashboard` | File late DCR |
| R16 | **Doctor birthday/anniversary** today | MR | 🟡 Dashboard alert only | `/mr/master-list` | Open |
| R17 | **Colleague birthday** today | MR / all | 🟡 In-app modal only | Profile / dashboard | Wish |
| R18 | Someone sent **birthday wish** | Recipient | ❌ Missing | `/profile` | Open |

---

## B3 — Admin receives

| # | Event | Recipient | Status | Deep link |
|---|-------|-----------|--------|-----------|
| A1 | New user / MR created (optional) | Admin | ❌ Missing | `/admin/users` |
| A2 | Critical system events (optional) | Admin | ❌ Missing | `/admin/dashboard` |

*Admin notifications are lower priority; focus MR + Manager first.*

---

# Part C — Deep linking (tap notification → open page)

When user **taps** a notification, the app opens on the correct screen.

### Already supported

Notifications store a `url` field (HashRouter path). Examples:

| kind | url |
|------|-----|
| `doctor_add_request` | `/manager/requests` |
| `dcr_submitted` | `/manager/reports` |
| `leave_request` | `/manager/leaves` |
| `late_dcr_request` | `/manager/requests` |
| `doctor_add_approved` | `/mr/master-list?subAreaId=…&doctorId=…` |

### AI will enhance (Phase 2B)

Add query params so the **exact request opens pre-selected**:

```
/manager/requests?tab=doctor_add&requestId=UUID
/manager/requests?tab=late_dcr&requestId=UUID
/manager/leaves?leaveId=UUID
/manager/reports?mrId=UUID&date=YYYY-MM-DD
```

App reads params on load → scrolls to / highlights that item.

---

# Part D — Quick actions from notification panel (Phase 2C) ✅

**Status:** Implemented — rich native notifications + Approve/Decline from shade.

| Level | Experience | Status |
|-------|------------|--------|
| **Level 1** | Tap → app opens on target page | ✅ |
| **Level 2** | Expanded notification shows MR/doctor context + subtitle; tap for full page | ✅ |
| **Level 3** | Approve/Decline from shade without opening app | ✅ doctor add & doctor removal; leave/late DCR/TP/unlock open app to confirm |

**What you get on Android:**
- Maktree logo as large icon, blue `#2563EB` accent (matches app theme)
- **BigText** body with names — e.g. *"Tushar requested to add Dr. Padurang Landge (Cardiologist)"*
- Subtitle line under title — e.g. *"Tushar · Dr. Padurang Landge"*
- **Approve** / **Decline** buttons on manager approval notifications
- Tap notification → deep link to exact page

**Personalized copy examples:**
- Doctor rejected: *"Manoj Wadekar declined adding Dr. X to your list."*
- Doctor add to manager: *"Tushar requested to add Dr. X (Cardiologist). Tap to review."*
- Account blocked: push to `/account-blocked`

**Phase 2D implemented:** server cron jobs for DCR 8 PM / 11 PM IST, birthdays (9 AM IST), missed DCR (7 AM IST). Client `useDcrReminders` remains as fallback when app is open.

---

# Part E — Scheduled / background notifications (Phase 2D) ✅

| Event | Who | Schedule (IST) | Status |
|-------|-----|----------------|--------|
| DCR not filed — 8 PM | MR | Daily 20:00 | ✅ `cron_send_dcr_reminders(20)` |
| DCR not filed — 11 PM | MR | Daily 23:00 | ✅ `cron_send_dcr_reminders(23)` |
| Missed DCR auto-mark + alert | MR + Manager | Daily 07:00 | ✅ `cron_process_missed_dcr_alerts()` |
| Employee birthday today | Team | Daily 09:00 | ✅ `cron_send_employee_birthdays()` |
| Doctor birthday today | MR | Daily 09:00 | ✅ `cron_send_doctor_birthdays_today()` |
| Manager month-end backup due | Manager | Last 3 days of month | ❌ Future |

**Cron jobs (UTC):** `maktree-dcr-reminder-8pm-ist`, `maktree-dcr-reminder-11pm-ist`, `maktree-birthdays-9am-ist`, `maktree-missed-dcr-7am-ist`

**Manual test:** `SELECT public.cron_run_daily_scheduled_notifications('dcr_reminder_20');`

**Note:** Enable **pg_cron** in Supabase Dashboard → Database → Extensions if cron jobs did not register automatically.

---

# Part F — Implementation order (AI work after your Firebase setup)

When you say **"Phase 2A done"**, AI will implement in this order:

```
Phase 2B-1  Wire VITE_ENABLE_NATIVE_PUSH + test existing ✅ notifications via FCM
Phase 2B-2  Add missing manager notifications (M2, M6–M9, M11)
Phase 2B-3  Add missing MR notifications (R3, R11–R12, R15–R18)
Phase 2B-4  Deep link query params on UnlockRequests / Leaves / Reports pages
Phase 2C-1  Rich FCM + native Android notification UI ✅
Phase 2C-2  execute_notification_quick_action + shade buttons ✅
Phase 2D-1  Supabase cron: DCR reminders (8 PM, 11 PM IST)
Phase 2D-2  Supabase cron: birthdays + missed DCR alerts
```

Each batch is tested on your phone before moving to the next.

---

# Part G — Notification design standards

All notifications will follow:

| Field | Rule |
|-------|------|
| **title** | Short, action-oriented ("Leave request", "DCR submitted") |
| **body** | Who + what + when ("Rajesh requested leave for 05 Sep 2026") |
| **url** | Deep link with IDs in query string |
| **metadata** | `{ request_id, kind, mr_id, actions: ["approve","reject"] }` |
| **kind** | Stable snake_case key for routing and analytics |

**Channels (Android):**
- `maktree_alerts` — approvals, urgent
- `maktree_activity` — DCR submitted, FYI
- `maktree_reminders` — DCR 8PM/11PM, birthdays

---

# Part H — Who does what

| Task | You | AI |
|------|-----|-----|
| Firebase project + google-services.json | ✅ | |
| Supabase secrets (FCM JSON, PUSH_HOOK_SECRET) | ✅ | |
| SQL insert push_dispatch_config | ✅ | |
| VITE_ENABLE_NATIVE_PUSH=true + rebuild | ✅ | |
| Test push on phone | ✅ | |
| Add missing DB notification triggers | | ✅ |
| Deep link params in React pages | | ✅ |
| FCM action buttons + quick approve RPCs | | ✅ |
| Cron jobs for reminders/birthdays | | ✅ |
| Fix push/deeplink bugs from your reports | | ✅ |

---

# Part I — Testing checklist (after each sub-phase)

```
[ ] Login as MR on phone → submit doctor add request
[ ] Manager phone (background) receives push
[ ] Tap push → opens /manager/requests with correct request
[ ] Manager approves → MR receives push
[ ] Tap MR push → opens master list with doctor
[ ] Repeat for: leave, late DCR, DCR submit
[ ] DCR reminder at 8 PM (after Phase 2D)
[ ] Birthday notification (after Phase 2D)
[ ] Approve from notification button without opening app (Phase 2C)
```

---

# Part J — FAQ

**Will web/PWA notifications break?**  
No. Web keeps in-app bell + browser notifications. Native app gets FCM.

**Do MRs get notifications too?**  
Yes. Many already exist (approval results). Phase 2B adds the missing ones.

**Can admin get notifications?**  
Optional later (Part B3). Focus is MR + Manager first.

**Why did app crash on notification permission before?**  
Firebase wasn't configured. Fixed for Phase 1. Push re-enabled only after `google-services.json` + `VITE_ENABLE_NATIVE_PUSH=true`.

**Instagram-level without opening app?**  
Phase 2C adds Approve/Reject on the notification itself. Full headless approve is Level 3 if you need it.

---

# Related docs

- Firebase setup (your manual steps): **`docs/firebase-setup.md`**
- Phase 1 (complete): **`docs/PHASE_1_FIRST_RUN.md`**
- Full roadmap: **`docs/APP_DEVELOPMENT_PLAN.md`**

---

## Your next action

Start **Part A — Task A1** (Firebase project).

When Firebase is configured and push works for at least one existing notification, message:

> **Phase 2A done**

AI will then begin **Phase 2B** (missing notifications + deep links + rich actions plan).
