# Phase 1 — First Run on Device

**Current phase:** Phase 1  
**Previous phase:** Phase 0 — Foundation ✅ Complete  
**Next phase:** Phase 2 — Firebase push notifications (after you confirm Phase 1 works)

**Goal:** Install the Maktree app on a tablet/emulator, log in, and confirm the portal works.

---

## Is Android Studio an IDE?

**Yes.** Android Studio is Google’s IDE for Android apps (like VS Code, but for mobile).

You do **NOT** need to:
- ❌ Create **New Project**
- ❌ **Clone Repository**

We already have the Android project. You only **open** the existing `android` folder.

---

## Phase 1 checklist

Copy this and tick items as you go:

```
[ ] Task 1 — Android Studio SDK setup
[ ] Task 2 — .env file verified
[ ] Task 3 — Open android project (not new project)
[ ] Task 4 — Gradle sync completed (no errors)
[ ] Task 5 — App runs on device or emulator
[ ] Task 6 — Login works + dashboard loads
```

When all are checked, tell the AI: **"Phase 1 works"**

---

## Task 1 — One-time Android Studio setup (5–10 min)

1. Open **Android Studio**.
2. Welcome screen → **More Actions** → **SDK Manager**.
3. **SDK Platforms** tab — check one of:
   - Android 15 (API 35), or
   - Android 14 (API 34)
4. **SDK Tools** tab — ensure checked:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator *(optional — only if testing without a real tablet)*
5. Click **Apply** → wait for download → **OK**.

### Set JDK (Gradle)

1. **File → Settings** *(Windows)*  
   *(Mac: Android Studio → Settings)*
2. Go to **Build, Execution, Deployment → Build Tools → Gradle**
3. **Scroll to the TOP** of that page — look for **Gradle JDK** (a dropdown, not a checkbox).
4. Select one of these in **Gradle JDK**:
   - **jbr-21** / **Embedded JDK 21** *(recommended for Capacitor 8)*, or
   - **Download JDK → Vendor: JetBrains Runtime or Temurin → Version: 21**
5. **Do NOT use JDK 17** — Capacitor 8 requires **Java 21** (`invalid source release: 21` means JDK is too old).
6. **Do NOT use JDK 25+** — too new for Gradle (causes `Unsupported class file major version 69`).
7. Click **Apply** → **OK**

**If you only see checkboxes** (e.g. “Enable parallel Gradle model fetching”, “Download external annotations”) and **no “Gradle JDK” dropdown:**
- You are on the right page — **scroll up**; Gradle JDK is usually at the **top** of the Gradle settings page.
- Or try: **File → Settings → Build, Execution, Deployment → Gradle** *(some Studio versions use this path instead)*.
- **If Gradle sync already finished with no errors**, your JDK is probably fine — **skip this step** and continue to Task 3.

**Do NOT worry about** these checkboxes for now (leave as default):
- Enable parallel Gradle model fetching
- Download external annotations for dependencies

**Note:** Push notifications are **disabled in Phase 1** (no Firebase yet). The app will not ask for notification permission or crash after login. Phase 2 enables push via Firebase.

**File location:**
```
e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub\.env
```

**Must contain** (same values as Vercel production):

```env
VITE_SUPABASE_URL=https://limgkjuywvudkxnantda.supabase.co
VITE_SUPABASE_ANON_KEY=your-real-anon-key-here
```

- If file is missing → copy from `.env.example` and fill in real keys.
- If keys are placeholders → login will fail in the app.
- Ask the AI if you need help finding the correct keys.

---

## Task 3 — Open the Maktree Android project

### Option A — PowerShell (recommended)

```powershell
cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub"
npm run cap:open:android
```

### Option B — From Android Studio welcome screen

1. Click **Open** *(NOT “New Project”, NOT “Clone Repository”)*
2. Browse to:
   ```
   e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub\android
   ```
3. Select the **`android`** folder → **OK**

---

## Task 4 — Wait for Gradle sync

- Bottom status bar shows **“Gradle sync…”** or **“Indexing…”**
- First time can take **5–15 minutes**
- If prompted **Trust Project** → click **Trust Project**
- Wait until sync finishes with **no errors**

**If sync fails:** open the **Build** tab, copy the error, paste to the AI chat.

---

## Task 5 — Run the app on a device

### A) Real tablet/phone (recommended)

1. On tablet: **Settings → About tablet**
2. Tap **Build number** 7 times → Developer options enabled
3. **Settings → Developer options** → enable **USB debugging**
4. Connect tablet to PC with USB cable
5. On tablet, tap **Allow** when USB debugging prompt appears
6. In Android Studio top toolbar, select your device from the dropdown
7. Click green **Run ▶** button

### B) Emulator (if no tablet yet)

1. **Tools → Device Manager → Create Device**
2. Choose a tablet profile (e.g. Pixel Tablet) → **Next**
3. Download a system image → **Next** → **Finish**
4. Click **▶** on the emulator to start it
5. In Android Studio, click green **Run ▶**

---

## Task 6 — Test the app

1. App opens → Maktree **login screen** should appear
2. Log in with a test **MR** or **manager** account
3. Confirm:
   - [ ] Dashboard loads
   - [ ] You can open at least one page (e.g. menu, reports, profile)
   - [ ] No white/blank screen

---

## Phase 1 complete — tell the AI

When everything works, send this message:

> **Phase 1 works**

The AI will confirm and move you to **Phase 2 — Firebase push notifications**.

---

## If something fails — what to send the AI

| Problem | What to copy/send |
|---------|-------------------|
| Gradle sync failed | Full error from **Build** tab |
| App won't install | Error from **Run** / **Build** output |
| White/blank screen | Screenshot or describe what you see |
| Login fails | Error message on screen + confirm `.env` exists |
| Device not detected | Say "USB device not showing" — AI will help |

---

## Commands reference

```powershell
# Open Android Studio with correct project
cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub"
npm run cap:open:android

# Rebuild web app + sync to Android (after AI makes code changes)
npm run build:android
```

---

## FAQ

| Question | Answer |
|----------|--------|
| New Project? | **No** — open existing `android` folder |
| Clone Repository? | **No** — code is already on your PC |
| Write Kotlin/Java? | **No** — UI is your existing React portal |
| Install JDK separately? | Use **JDK 21** in Gradle settings (Capacitor 8 requirement) |
| Will this break the web portal? | **No** — web on Vercel is unchanged |
| Play Store needed? | **No** — we install APK directly on tablets |

---

## Related docs

- Full roadmap: `docs/APP_DEVELOPMENT_PLAN.md`
- Android details: `docs/android-setup.md`
- Push notifications (Phase 2): `docs/firebase-setup.md`

---

## Phase overview (where you are)

| Phase | Status |
|-------|--------|
| 0 — Foundation | ✅ Complete |
| **1 — First run on device** | **🔄 You are here** |
| 2 — Firebase push | Waiting |
| 3 — Branding | Waiting |
| 4 — Release APK | Waiting |
| 5 — Field pilot | Waiting |
| 6 — Web/PWA unchanged | Ongoing |
| 7 — Portal bug fixes | After app stable |
| 8 — Windows .exe (optional) | Later |
