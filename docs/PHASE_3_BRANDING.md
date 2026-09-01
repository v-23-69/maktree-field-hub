# Phase 3 — App branding & polish

**Previous phase:** Phase 2 — Notifications ✅  
**Current phase:** Phase 3 — Branding & polish ✅ COMPLETE  
**Next phase:** Phase 4 — Signed release APK (`docs/PHASE_4_RELEASE.md`)

---

## What was done (AI)

| Item | Status |
|------|--------|
| Android launcher icons from Maktree logo (blue `#2563eb` background) | ✅ |
| Splash screens (portrait + landscape, all densities) | ✅ |
| Branded notification large icon synced | ✅ |
| Splash stays until login/session restore completes (`NativeSplashGate`) | ✅ |
| App version on Profile page (native build + version) | ✅ |
| PWA install banner hidden on native (already in `InstallPrompt`) | ✅ |
| Version bumped to **1.0.0** (APK `versionCode` 2) | ✅ |

---

## Source assets

Regenerate icons/splash after logo changes:

```powershell
# Place 1024×1024 PNG at assets/icon.png (and optional assets/splash.png)
npm run cap:assets
npm run build:android
```

Source files live in `assets/` (from `public/android-chrome-512x512.png`).

---

## Your checklist

```
[ ] Android Studio → Sync Gradle → Run ▶ on tablet
[ ] Home screen icon shows Maktree logo on blue (not generic Capacitor)
[ ] Cold start: blue splash with logo → dashboard (no login flash if session saved)
[ ] Profile → bottom shows "Maktree SFA v1.0.0 · build 2" (or similar)
[ ] No "Install app" banner on native
[ ] Optional: send different logo file if you want icon updated
```

Phase 3 is complete. Continue in **`docs/PHASE_4_RELEASE.md`**.

---

## Related docs

- Master plan: `docs/APP_DEVELOPMENT_PLAN.md`
- Android setup: `docs/android-setup.md`
