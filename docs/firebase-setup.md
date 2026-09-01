# Firebase + FCM push notifications (Phase 2)

Enables **WhatsApp-style alerts** when the Maktree app is in the background or closed (e.g. manager notified when MR submits a doctor for approval).

---

## 1. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Add project** (e.g. `maktree-sfa`)
3. **Add Android app**
   - Package name: `com.maktree.sfa` (must match `capacitor.config.ts`)
   - App nickname: `Maktree SFA`
   - Skip Play Store for now
4. Download **`google-services.json`**
5. Copy it to:
   ```
   android/app/google-services.json
   ```
   (This file is gitignored — do not commit it.)

---

## 2. Firebase Cloud Messaging API

1. Firebase Console → **Project settings** → **Cloud Messaging**
2. Enable **Firebase Cloud Messaging API (V1)** in Google Cloud Console if prompted
3. **Project settings** → **Service accounts** → **Generate new private key**
4. Save the JSON file securely (never commit to git)

---

## 3. Supabase Edge Function secrets

Deploy the function (see step 5), then set secrets in **Supabase Dashboard → Edge Functions → send-push-notification → Secrets**:

| Secret | Value |
|--------|--------|
| `FCM_SERVICE_ACCOUNT_JSON` | Full contents of the Firebase service account JSON file (one line is fine) |
| `PUSH_HOOK_SECRET` | Random long string you generate (e.g. `openssl rand -hex 32`) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions.

---

## 4. Enable database push dispatch

Run this **once** in Supabase SQL Editor (replace `YOUR_PUSH_HOOK_SECRET` with the same value as `PUSH_HOOK_SECRET`):

```sql
INSERT INTO private.push_dispatch_config (key, value)
VALUES ('push_hook_secret', 'YOUR_PUSH_HOOK_SECRET')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
```

Also ensure **pg_net** is enabled (Supabase Dashboard → Database → Extensions → `pg_net`).

When a row is inserted into `user_notifications`, Postgres calls the Edge Function, which sends FCM to all devices registered for that user.

---

## 5. Deploy Edge Function

From project root (with Supabase CLI logged in):

```powershell
supabase functions deploy send-push-notification --no-verify-jwt
```

Or use the script:

```powershell
bash supabase/functions/deploy.sh
```

`--no-verify-jwt` is required because the database trigger uses `x-push-hook-secret`, not a user JWT.

---

## 6. Rebuild Android app

After `google-services.json` is in place:

```powershell
npm run build:android
npm run cap:open:android
```

Run on device → log in → allow notifications → token is saved to `device_push_tokens`.

---

## 7. Test push

1. Log in as **manager** on a tablet (native app, notifications allowed)
2. From another account/session, trigger an action that creates a notification for that manager (e.g. MR submits doctor add request)
3. Manager should receive a system notification even if the app is in the background

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No push token in DB | Check notification permission; `google-services.json` must exist before build |
| `FCM not configured` in function logs | Set `FCM_SERVICE_ACCOUNT_JSON` secret |
| `Unauthorized` from function | Match `PUSH_HOOK_SECRET` and `private.push_dispatch_config` value |
| Push works in foreground only | FCM not wired — complete steps 2–5 |
| Gradle: google-services | Rebuild after adding `google-services.json` |
