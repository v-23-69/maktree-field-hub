-- =============================================================================
-- MKT-MR-002 → login email vishal5952v@gmail.com (employee code + password flow)
--
-- The app RPC returns public.users.email, then Supabase Auth signs in with that
-- email + password. So BOTH must match:
--   1) public.users.email = vishal5952v@gmail.com for employee_code MKT-MR-002
--   2) Authentication → Users has a user with that exact email + your password
--
-- Do this FIRST in Dashboard: Authentication → Add user (or invite)
--   Email:    vishal5952v@gmail.com
--   Password: (what you want, e.g. Maktree@123)
--
-- Then run this entire script in Supabase → SQL → New query → Run.
-- =============================================================================

-- 1) Store the new email on the profile row (replaces ashok.mulik@maktree.in)

UPDATE public.users
SET
  email = lower(trim('vishal5952v@gmail.com')),
  updated_at = now()
WHERE lower(trim(employee_code)) = lower(trim('MKT-MR-002'));

-- 2) Link that row to the Auth user for vishal5952v@gmail.com (UUID from auth.users)

UPDATE public.users u
SET
  auth_user_id = au.id,
  updated_at = now()
FROM auth.users au
WHERE lower(trim(u.employee_code)) = lower(trim('MKT-MR-002'))
  AND lower(trim(au.email::text)) = lower(trim('vishal5952v@gmail.com'));

-- 3) Optional: display name (uncomment if you want)

-- UPDATE public.users
-- SET full_name = 'Vishal', updated_at = now()
-- WHERE lower(trim(employee_code)) = lower(trim('MKT-MR-002'));

-- 4) Verify

-- SELECT employee_code, email, auth_user_id
-- FROM public.users
-- WHERE lower(trim(employee_code)) = 'mkt-mr-002';

-- SELECT * FROM login_lookup_by_employee_code('MKT-MR-002');
-- Should return one row: email vishal5952v@gmail.com, is_active true, has_auth_user true.
