# Maktree SFA — Application Development Plan

**Goal:** Ship the same Maktree portal as an installable Android app (tablets/phones) while keeping the web/PWA portal on Vercel **unchanged and safe**.

**Strategy:** One React codebase → three delivery channels:

| Channel | Users | Status |
|---------|-------|--------|
| Web / PWA (Vercel) | Managers on laptops | Live — no breaking changes |
| Android APK (Capacitor) | MRs + managers on tablets/phones | In progress |
| Windows `.exe` (optional, later) | Office desktops | Planned after Android stable |

---

## Safety rules (we follow these in every phase)

1. **Never break the live web portal** — Android changes are additive (Capacitor shell + optional push).
2. **Database changes are backward-compatible** — new tables/RPCs only; existing flows untouched.
3. **Push is optional** — if Firebase is not configured, in-app notifications still work when the app is open.
4. **Test on one device first** — then roll out APK to the field team.
5. **You own secrets** — Firebase keys, APK signing keystore stay on your machine (not in git).

---

## Current status (already done)

| Item | Owner | Status |
|------|-------|--------|
| Capacitor + Android project | AI | Done |
| Native shell (status bar, back button, splash) | AI | Done |
| Push token table + RPCs in Supabase | AI | Done |
| Push dispatch trigger on `user_notifications` | AI | Done |
| `send-push-notification` Edge Function deployed | AI | Done |
| Frontend push registration + logout cleanup | AI | Done |
| Build env verification script | AI | Done |
| `docs/android-setup.md` | AI | Done |
| `docs/firebase-setup.md` | AI | Done |

---

## Phase 0 — Foundation ✅ COMPLETE

**Objective:** Project ready for Android Studio without touching production behaviour.

### AI (done)
- [x] Install Capacitor packages
- [x] Generate `android/` project
- [x] Configure `capacitor.config.ts`
- [x] Add npm scripts: `build:android`, `cap:open:android`
- [x] Supabase migration: `device_push_tokens`, push trigger
- [x] Deploy Edge Function `send-push-notification`

### You
- [x] Install Android Studio (in progress / done)
- [ ] Confirm `.env` exists with real Supabase URL + anon key (same as Vercel)

**Exit criteria:** `npm run build:android` succeeds.

---

## Phase 1 — First run on device ✅ COMPLETE

**Objective:** App installs and login works on a real tablet or emulator.

### You (manual)
1. Open Android Studio → **SDK Manager** → install Android SDK Platform 35 + Build Tools.
2. **Settings → Gradle → JDK 21** (Download JDK 21 if needed — not 17, not 25).
3. In PowerShell:
   ```powershell
   cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub"
   npm run cap:open:android
   ```
4. Wait for Gradle sync (first time: 5–15 min).
5. Connect tablet via USB **or** start an emulator.
6. Enable **USB debugging** on the tablet (Developer options).
7. Click **Run ▶** in Android Studio.
8. Log in with a test MR or manager account.
9. Report back: **works** or paste **Build / Logcat errors**.

### AI (when you report)
- Fix Gradle sync failures
- Fix white screen / login issues
- Fix mobile UI layout bugs you find
- Re-run `npm run build:android` after fixes

**Exit criteria:** Login → dashboard loads → basic navigation works on device.

**Do not proceed to Phase 2 until Phase 1 passes.**

---

## Phase 1 — First run on device ✅ COMPLETE

## Phase 2 — Advanced notifications ✅ COMPLETE

**Open alongside chat:** **`docs/PHASE_2_NOTIFICATIONS.md`**

---

## Phase 3 — App branding & polish ✅ COMPLETE

**Objective:** App looks like Maktree (not generic Capacitor default).

**Open alongside chat:** **`docs/PHASE_3_BRANDING.md`**

### You (manual)
- Run app on device after `npm run build:android`
- Confirm icon + splash + Profile version
- Optional: replace `assets/icon.png` with final logo and run `npm run cap:assets`

### AI (done)
- [x] `@capacitor/assets` — launcher icons + splash (blue `#2563eb`)
- [x] Branded splash until auth ready
- [x] App version in Profile
- [x] Version 1.0.0 / versionCode 2 (Phase 4: versionCode 3) (Phase 4 bumped to versionCode 3)

**Exit criteria:** Branded icon + splash; no PWA install on native; Profile shows version.

---

## Phase 4 — Signed release APK (distribution) ✅ COMPLETE

**Objective:** APK you can share with the team (no Play Store).

**Open alongside chat:** **`docs/PHASE_4_RELEASE.md`**

### You (manual)
1. Android Studio → **Build → Generate Signed App Bundle / APK**.
2. Create a **keystore** (password + alias) — **keep this file forever**; you need it for every future update.
3. Build **release** APK (`versionCode` 3 / `versionName` 1.0.0).
4. Copy `app-release.apk` to tablets (USB, Drive, WhatsApp).
5. On each tablet: uninstall any **debug** Maktree SFA first, then allow **Install unknown apps** for the file manager used.
6. Install and test login + one push tap.

### AI
- [x] Bump `versionCode` to 3 in `android/app/build.gradle`
- [x] Document release checklist (`docs/PHASE_4_RELEASE.md`)
- [ ] Fix any release-only build issues you report

**Exit criteria:** Release APK installs on 2+ field tablets without debug USB.

---

## Phase 5 — Field pilot (controlled rollout) 🔄 CURRENT

**Objective:** 3–5 MRs + 1 manager use the app for 1 week before full rollout.

### You (manual)
- Install APK on pilot devices
- Collect feedback (screenshots, screen recordings, WhatsApp messages)
- List bugs by priority: **blocker / major / minor**

### AI
- Fix bugs from your list (one phase at a time)
- Never deploy DB changes without migration + your approval for production
- Keep web portal stable throughout

**Exit criteria:** Pilot users complete daily workflow (DCR, tour program, leave) without blockers.

---

## Phase 6 — Web portal (laptops) — keep as-is

**Objective:** Managers on laptops continue using browser / PWA.

### You
- Nothing required unless you want to promote “Install app” on Chrome for laptops.

### AI
- Ensure Capacitor changes do not regress PWA
- PWA service worker stays **web-only** (already configured)

**Exit criteria:** Vercel deploy unchanged; laptop users unaffected.

---

## Phase 7 — Portal improvements (after app is stable)

**Objective:** Fix major/minor portal issues you listed earlier — safely, after mobile is working.

### Process
1. You list issues by priority.
2. AI fixes in small batches (one feature area per session).
3. Test on **web + Android** before marking done.
4. Deploy web to Vercel; distribute new APK only when Android-affected.

### AI
- Bug fixes, UX improvements, performance
- Supabase migrations via MCP (with your go-ahead)

### You
- Test and confirm each batch
- Approve production DB migrations

---

## Phase 8 — Optional: Windows `.exe` (later)

**Objective:** Desktop installer for office PCs (not urgent).

### You
- Install Rust + VS Build Tools (if we choose Tauri) OR use Electron (simpler).

### AI
- Add Tauri/Electron wrapper around same `dist/` build
- Package `.exe` installer

**Defer until:** Android pilot is successful.

---

## Quick reference — who does what

| Task | You | AI |
|------|-----|-----|
| Android Studio install & Run ▶ | ✅ | |
| Create `.env` with Supabase keys | ✅ | |
| Firebase project + `google-services.json` | ✅ | |
| Supabase Edge Function secrets | ✅ | |
| APK signing keystore | ✅ | |
| Distribute APK to tablets | ✅ | |
| Code, migrations, Edge Functions | | ✅ |
| `npm run build:android` | | ✅ |
| Fix build/runtime errors from logs | | ✅ |
| UI/bug fixes | | ✅ |
| Vercel web deploy | ✅ (or AI with approval) | ✅ |

---

## Commands cheat sheet

```powershell
# Daily dev (after UI changes)
npm run build:android

# Open Android Studio
npm run cap:open:android

# Web portal (unchanged)
npm run dev
npm run build
```

---

## How we work together each session

1. **You say which phase** you're on (or paste errors/screenshots).
2. **AI does code/DB work** and tells you exactly what to click/run next.
3. **You run manual steps** (Android Studio, Firebase, APK install).
4. **You confirm** pass/fail before we move to the next phase.

---

## Next action (right now)

**Phase 5 — Field pilot:** copy `android/app/release/app-release.apk` to 3–5 MRs + 1 manager. Same APK, no rebuild needed.

Keep the keystore at `Documents\Maktree-keys` forever. Collect blockers for a week, then we fix them.
