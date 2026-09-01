# Phase 4 — Signed release APK

**Previous phase:** Phase 3 — Branding & polish ✅  
**Current phase:** Phase 4 — Signed release APK (share with field team)  
**Next phase:** Phase 5 — Field pilot

**Goal:** A signed `app-release.apk` you can copy to tablets. No Play Store.

Open this file beside chat. You create the keystore and click Generate in Android Studio. The AI prepares the version bump and web assets.

---

## What was done (AI)

| Item | Status |
|------|--------|
| `versionCode` **3** / `versionName` **1.0.0** | ✅ |
| Optional Gradle signing via `android/keystore.properties` (gitignored) | ✅ |
| Keystore / `.jks` / `keystore.properties` ignored by git | ✅ |
| Web + Capacitor sync ready for release (`npm run build:android`) | see Task 2 |

---

## Rules (read once)

1. **Keep the keystore forever.** Same file + same passwords for every future update. Lose it → tablets cannot update; they must uninstall and reinstall (data/login again).
2. **Never commit** `.jks`, `.keystore`, `keystore.properties`, `.env`, or `google-services.json`.
3. **Uninstall the debug app first** on each tablet. Debug USB installs use a different signature; Android will refuse to update them.
4. **Do not use the system JDK 25** for Gradle. Android Studio must keep **JDK 21** (Phase 1). Creating the keystore with `keytool` is fine.

---

## Checklist

```
[ ] Task 1 — Create release keystore (once, keep forever)
[ ] Task 2 — Confirm npm run build:android already ran
[ ] Task 3 — Generate signed release APK in Android Studio
[ ] Task 4 — Copy APK to tablets
[ ] Task 5 — Allow unknown sources + install
[ ] Task 6 — Verify login, Profile version, one push tap
```

When Task 6 passes on **2+ tablets**, tell the AI: **"Phase 4 works"**

---

## Task 1 — Create the keystore (once)

**Store it outside the repo**, for example:

```
C:\Users\Admin\Documents\Maktree-keys\maktree-sfa-release.jks
```

Create the `Maktree-keys` folder first. Write the two passwords in a password manager or a paper note in the office safe. You need both for every future APK.

### Option A — Android Studio (recommended)

1. Open the **`android`** folder in Android Studio (not a new project):
   ```powershell
   cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub"
   npm run cap:open:android
   ```
2. Wait for Gradle sync to finish.
3. **Build → Generate Signed App Bundle or APK…**
4. Choose **APK** → **Next**.
5. Click **Create new…**
6. Fill in:

   | Field | Value |
   |-------|--------|
   | Key store path | `C:\Users\Admin\Documents\Maktree-keys\maktree-sfa-release.jks` |
   | Password | choose a strong password — **save it** |
   | Confirm | same password |
   | Alias | `maktree` |
   | Key password | can match store password — **save it** |
   | Validity (years) | `25` |
   | First and last name | your name |
   | Organization | `Maktree Medicines` |
   | Country code | `IN` |

7. **OK** → the wizard returns to the keystore screen with the new file selected.
8. Continue to **Task 3** (same wizard).

### Option B — PowerShell `keytool` (optional)

Only if you prefer CLI. `keytool` will ask for passwords interactively:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Documents\Maktree-keys"
keytool -genkeypair -v -keystore "$env:USERPROFILE\Documents\Maktree-keys\maktree-sfa-release.jks" -keyalg RSA -keysize 2048 -validity 9125 -alias maktree
```

Then use that `.jks` in Android Studio **Build → Generate Signed App Bundle or APK…** → **Choose existing**.

---

## Task 2 — Fresh web assets in the Android project

The AI usually runs this. If you need to run it yourself:

```powershell
cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub"
npm run build:android
```

This bakes `.env` (Supabase URL + anon key + `VITE_ENABLE_NATIVE_PUSH`) into the APK. If `.env` was missing, login would fail on tablets.

---

## Task 3 — Generate the signed APK

If you already have the wizard open from Task 1, skip to step 4.

1. Android Studio → **Build → Generate Signed App Bundle or APK…**
2. **APK** → **Next**
3. Select the keystore from Task 1. Enter store password, alias `maktree`, key password → **Next**
4. Destination folder: leave default (`android/app/release/` or `android/app/`)
5. Build variant: **release**
6. Signature versions: tick **V1 (Jar Signature)** and **V2 (Full APK Signature)**
7. **Create** / **Finish**
8. When done, click **locate** or open:

```
e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub\android\app\release\app-release.apk
```

If the wizard put it under `android/app/app-release.apk`, that is also fine — copy that file.

**If Generate fails:** copy the **Build** tab error into chat.

---

## Task 4 — Copy APK to tablets

Any of these:

- USB cable → copy `app-release.apk` to Downloads
- Google Drive / OneDrive
- WhatsApp (file, not compressed into a zip if you can avoid it)

Share **only** `app-release.apk`. Do not share the `.jks` or passwords.

---

## Task 5 — Install on each tablet

**If a debug Maktree SFA is already installed:** uninstall it first  
Settings → Apps → **Maktree SFA** → Uninstall.

Then allow sideloading (wording varies by Android version):

### Android 8+ (most tablets)

1. Open the **Files** / **My Files** / **Downloads** app that you will use to tap the APK.
2. Settings → **Apps** → special access → **Install unknown apps** (or tap the APK once and follow **Settings**).
3. Enable **Allow from this source** for that file manager / Drive / WhatsApp / Chrome.
4. Open `app-release.apk` → **Install**.
5. If Play Protect warns, choose **Install anyway** / **More details → Install anyway**.

### After install

Open **Maktree SFA**. Allow notifications if asked (needed for push).

---

## Task 6 — Verify before distributing widely

On at least one tablet (ideally two):

```
[ ] Log in as MR — dashboard loads
[ ] Log in as Manager — dashboard loads
[ ] Profile (bottom) shows: Maktree SFA v1.0.0 · build 3
[ ] One push: with app in background, trigger a real notification (e.g. MR doctor-add request) → tap → correct screen
```

**Profile still says build 2:** you installed an old APK. Repeat Task 3 and reinstall.

**Login fails:** `.env` was missing or placeholder at build time. Fix `.env`, run `npm run build:android`, generate a new signed APK (same keystore).

**Push works in debug USB but not on this APK:** confirm `android/app/google-services.json` exists and `VITE_ENABLE_NATIVE_PUSH=true` in `.env` before rebuild.

**“App not installed” / signature conflict:** uninstall the old Maktree SFA, then install the release APK again.

---

## Future updates (Phase 5+)

Every new APK:

1. AI bumps `versionCode` (4, 5, …) in `android/app/build.gradle`
2. `npm run build:android`
3. Generate Signed APK with the **same** `.jks` and passwords
4. Tablets can **update over** the previous release (no uninstall) as long as the keystore matches

---

## Optional — command-line signed build

After Task 1, copy `android/keystore.properties.example` → `android/keystore.properties` and fill real paths/passwords. Then in Android Studio or:

```powershell
cd "e:\MakTree Medicines Portal\V1 Backup 27 may 26\maktree-field-hub\android"
.\gradlew.bat assembleRelease
```

Use this only if Gradle JDK is **21**. System Java 25 will fail. Prefer Task 3 if unsure.

---

## Related docs

- Master plan: `docs/APP_DEVELOPMENT_PLAN.md`
- Android Studio first run: `docs/PHASE_1_FIRST_RUN.md`
- Android commands: `docs/android-setup.md`
- Firebase / push: `docs/firebase-setup.md`
