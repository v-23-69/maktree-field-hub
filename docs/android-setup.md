# Maktree SFA — Android app setup

This project uses **Capacitor** to wrap the same React portal as a native Android app (APK). The web/PWA build on Vercel is unchanged.

## What you install externally (one-time)

| Tool | Required? | Notes |
|------|-----------|--------|
| **Android Studio** | Yes | Includes Android SDK, emulator, Gradle |
| **JDK 21** | Yes | Capacitor 8 requires Java 21 — set in Settings → Build Tools → Gradle → Gradle JDK |
| **Node.js 18+** | Yes | Already used for the web portal |
| Firebase account | Phase 2 | For WhatsApp-style push when app is closed |

You do **not** need to rewrite the UI in Kotlin. Android Studio only builds the native shell around your existing React app.

---

## Android Studio — first-time setup

1. Install [Android Studio](https://developer.android.com/studio) (latest stable).
2. Open Android Studio → **More Actions → SDK Manager**:
   - **Android SDK Platform 35** (or latest)
   - **Android SDK Build-Tools** (latest)
   - **Android SDK Command-line Tools**
3. **Settings → Build, Execution, Deployment → Build Tools → Gradle**
   - Gradle JDK: **JDK 21** (not 17, not 25)
4. Optional: create a virtual device (**Device Manager → Create Device**) for testing without a physical tablet.

---

## Environment variables (important)

Capacitor embeds Vite env vars at **build time**. Before building the APK, ensure `.env` exists in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Same values as production/Vercel. Without these, login will not work in the app.

---

## Daily developer workflow

From the project root in PowerShell:

```powershell
# 1. Build web app + sync into Android project
npm run build:android

# 2. Open Android Studio on the android/ folder
npm run cap:open:android
```

In Android Studio:

1. Wait for Gradle sync to finish (first time can take several minutes).
2. Connect a tablet/phone with **USB debugging** enabled, or start an emulator.
3. Click **Run ▶** (green play) — installs debug APK on the device.

After UI changes, always run `npm run build:android` again before testing in Android Studio.

---

## Build a release APK (share with team, no Play Store)

Full click-by-click guide: **`docs/PHASE_4_RELEASE.md`**

1. In Android Studio: **Build → Generate Signed App Bundle / APK**
2. Choose **APK** → create or select a keystore (keep this file **forever**, outside the git repo).
3. Build **release** variant. Tick **V1** and **V2** signatures.
4. Output: `android/app/release/app-release.apk`
5. Uninstall any **debug** Maktree SFA on the tablet first (different signing key).
6. Copy APK to tablets; enable **Install unknown apps** for the file manager/browser used to open it.

Current release numbers: **versionName 1.0.0**, **versionCode 3**. Bump `versionCode` in `android/app/build.gradle` for every later APK.

---

## How Cursor / the AI agent works with Android Studio

There is **no direct plugin** that connects Android Studio to the AI. Collaboration works through the **project files on disk**:

| What the agent can do | What you do in Android Studio |
|------------------------|-------------------------------|
| Edit React/TypeScript UI | Run app on device/emulator |
| Edit `capacitor.config.ts`, `android/` Gradle files | Gradle sync, signing, Run ▶ |
| Run `npm run build:android`, `npx cap sync` | First-time SDK setup, USB debugging |
| Add Supabase migrations / Edge Functions (via MCP) | Install APK on field tablets |
| Read build errors you paste from Android Studio | Generate signed release APK |

**Best workflow:**

1. Agent changes code → runs `npm run build:android`.
2. You open Android Studio (`npm run cap:open:android`) and click Run.
3. If Gradle/build fails, copy the **Build** tab error into chat — the agent can fix `android/` config or dependencies.
4. For runtime bugs on device, describe or screenshot — agent fixes React/Capacitor layer.

The `android/` folder lives inside this repo, so any edit the agent makes is picked up when you sync/open Android Studio.

---

## npm scripts reference

| Script | Purpose |
|--------|---------|
| `npm run build:android` | Production web build + copy to `android/` |
| `npm run cap:sync` | Sync web assets & plugins without full build |
| `npm run cap:open:android` | Open `android/` in Android Studio |
| `npm run cap:run:android` | Build + run on connected device (CLI) |

---

## Phase 2 — Push notifications (FCM)

Full setup guide: **`docs/firebase-setup.md`**

Summary:
1. Create Firebase project → download `google-services.json` → `android/app/`
2. Set Supabase Edge Function secrets (`FCM_SERVICE_ACCOUNT_JSON`, `PUSH_HOOK_SECRET`)
3. Deploy `send-push-notification` function
4. Insert hook secret into `private.push_dispatch_config`

Until Firebase is configured, notifications work when the app is **open** (same as web).

---

## Troubleshooting

**Gradle sync failed** — Open SDK Manager, install missing platform/build-tools; use **JDK 21** for Gradle JDK.

**White screen on launch** — Run `npm run build:android` again; check `.env` was present at build time.

**Supabase / Realtime errors** — `capacitor.config.ts` uses `androidScheme: 'https'` for WebView compatibility.

**PWA install banner in app** — Hidden automatically on native (`InstallPrompt` checks `isNativeApp()`).
