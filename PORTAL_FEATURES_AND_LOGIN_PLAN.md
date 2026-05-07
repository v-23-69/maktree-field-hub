# Portal Features, Login Setup, and Testing Plan

## Current feature map (from app routes and code)

### Authentication and access
- Email + password login via Supabase Auth.
- Role-based dashboards and protected routes.
- Blocked-user handling and complaint route.
- Session restoration and redirect to role dashboard.

### MR module
- Dashboard
- New daily report
- Report history and report detail
- Master list
- Leave
- Expense
- Tour program

### Manager module
- Dashboard
- Reports
- Analytics
- Unlock requests
- Targets
- Leaves
- Holidays

### Admin module
- Dashboard
- Users
- Doctors
- Areas
- MR access
- Targets
- Holidays

### Shared and platform
- Profile pages
- PWA manifest + service worker + install prompt UI
- Refresh-safe hash routing

## Login functionality currently used

- Frontend login uses `supabase.auth.signInWithPassword({ email, password })`.
- After sign-in, app loads `public.users` profile by `auth_user_id`.
- Dashboard route is selected by `users.role`:
  - `mr` -> `/mr/dashboard`
  - `manager` -> `/manager/dashboard`
  - `admin` -> `/admin/dashboard`

## Known Supabase-side requirements for successful login

For each user account:
1. An Authentication user must exist in `auth.users` with the exact email.
2. A matching row must exist in `public.users`.
3. `public.users.auth_user_id` must point to the same `auth.users.id`.
4. `public.users.role` must be correct (`mr` / `manager` / `admin`).
5. `public.users.is_active` must be `true`.
6. (If used) block flags must not block sign-in flow.

## Requested user-role mapping

- MR
  - Arun Khadul: `arunkhadul@gmail.com`
  - Dheeraj Khande: `kandedheeraj@gmail.com`
- Manager
  - Manoj Wadekar: `wadekarmanoj13@gmail.com`
  - Kiran Wadekar: `srkvi5531@gmail.com`
- Admin
  - `vishal5952v@gmail.com`

## SQL verification checklist (run in Supabase SQL editor)

```sql
-- 1) Verify public profile rows and role mapping
SELECT full_name, email, role, is_active, auth_user_id
FROM public.users
WHERE lower(email) IN (
  'arunkhadul@gmail.com',
  'kandedheeraj@gmail.com',
  'wadekarmanoj13@gmail.com',
  'srkvi5531@gmail.com',
  'vishal5952v@gmail.com'
)
ORDER BY role, full_name;

-- 2) Verify auth users exist
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE lower(email) IN (
  'arunkhadul@gmail.com',
  'kandedheeraj@gmail.com',
  'wadekarmanoj13@gmail.com',
  'srkvi5531@gmail.com',
  'vishal5952v@gmail.com'
)
ORDER BY email;

-- 3) Verify public <-> auth link is correct
SELECT
  u.full_name,
  u.email AS public_email,
  au.email AS auth_email,
  u.role,
  u.is_active,
  (u.auth_user_id = au.id) AS is_linked_correctly
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.auth_user_id
WHERE lower(u.email) IN (
  'arunkhadul@gmail.com',
  'kandedheeraj@gmail.com',
  'wadekarmanoj13@gmail.com',
  'srkvi5531@gmail.com',
  'vishal5952v@gmail.com'
)
ORDER BY u.role, u.full_name;
```

## Default-password rollout (recommended approach)

Use your existing edge function `create-auth-user` for new users, or admin reset from Supabase Auth dashboard for existing users.

Suggested rollout:
1. Set a temporary default password for the five users.
2. Confirm each can login and reach correct dashboard.
3. In next phase, enforce `must_change_password` flow at first login.

## End-to-end test checklist (login focus)

1. Login with each of the five emails + default password.
2. Confirm redirect to expected dashboard by role.
3. Refresh dashboard page and confirm no 404.
4. Close tab and reopen app to verify session restoration speed.
5. Logout/login again to verify stable profile linking.
6. Validate manager views can load MR-linked data.
7. Validate admin can access user management pages.

## Note about live schema introspection

The local codebase includes migrations, RPCs, and edge functions, but live schema extraction from MCP requires project permission for this Supabase account. If permission is granted, the next step is to export:
- all tables (+ columns, keys),
- all functions/RPCs,
- all triggers,
- RLS policies,
- and auth linkage health checks.
