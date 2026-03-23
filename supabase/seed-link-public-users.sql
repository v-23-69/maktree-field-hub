-- =============================================================================
-- Fix "Unknown employee code" / empty RPC: create public.users FROM auth.users
--
-- Run the whole script in Supabase → SQL → New query → Run.
-- Section A is the one you need if users exist only in Authentication.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Insert one row per Auth user, matched by email to employee code + role
--    (Skips if that auth user already has a public.users row.)
-- -----------------------------------------------------------------------------

INSERT INTO public.users (
  id,
  employee_code,
  full_name,
  email,
  role,
  is_active,
  auth_user_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  m.code,
  m.full_name,
  lower(trim(au.email::text)),
  m.role,
  true,
  au.id,
  now(),
  now()
FROM auth.users au
INNER JOIN (
  VALUES
    ('arun.khadul@maktree.in', 'MKT-MR-001', 'Arun Khadul', 'mr'),
    ('vishal5952v@gmail.com', 'MKT-MR-002', 'Ashok Mulik', 'mr'),
    ('dheeraj.kande@maktree.in', 'MKT-MR-003', 'Dheeraj Kande', 'mr'),
    ('manoj.wadekar@maktree.in', 'MKT-MGR-001', 'Manoj Wadekar', 'manager'),
    ('kiran.wadekar@maktree.in', 'MKT-MGR-002', 'Kiran Wadekar', 'manager'),
    ('admin@maktreemedicines.com', 'MKT-ADMIN-001', 'Admin', 'admin')
) AS m(email, code, full_name, role)
  ON lower(trim(au.email::text)) = lower(trim(m.email))
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id)
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE lower(trim(u.email::text)) = lower(trim(au.email::text))
  );

-- If INSERT fails on `role` type, cast in the SELECT, e.g. m.role::your_enum_name

-- -----------------------------------------------------------------------------
-- B) Link auth_user_id + fix email/code for rows that already exist by email
-- -----------------------------------------------------------------------------

UPDATE public.users u
SET
  auth_user_id = au.id,
  employee_code = COALESCE(NULLIF(trim(u.employee_code), ''), m.code),
  full_name = COALESCE(NULLIF(trim(u.full_name), ''), m.full_name),
  email = lower(trim(au.email::text)),
  role = m.role,
  is_active = true,
  updated_at = now()
FROM auth.users au
INNER JOIN (
  VALUES
    ('arun.khadul@maktree.in', 'MKT-MR-001', 'Arun Khadul', 'mr'),
    ('vishal5952v@gmail.com', 'MKT-MR-002', 'Ashok Mulik', 'mr'),
    ('dheeraj.kande@maktree.in', 'MKT-MR-003', 'Dheeraj Kande', 'mr'),
    ('manoj.wadekar@maktree.in', 'MKT-MGR-001', 'Manoj Wadekar', 'manager'),
    ('kiran.wadekar@maktree.in', 'MKT-MGR-002', 'Kiran Wadekar', 'manager'),
    ('admin@maktreemedicines.com', 'MKT-ADMIN-001', 'Admin', 'admin')
) AS m(email, code, full_name, role)
  ON lower(trim(au.email::text)) = lower(trim(m.email))
WHERE lower(trim(u.email::text)) = lower(trim(m.email));

-- -----------------------------------------------------------------------------
-- C) Verify (uncomment to run)
-- -----------------------------------------------------------------------------

-- SELECT employee_code, email, auth_user_id IS NOT NULL AS linked FROM public.users ORDER BY employee_code;
-- SELECT * FROM login_lookup_by_employee_code('MKT-MR-001');

-- -----------------------------------------------------------------------------
-- D) MR ↔ Manager links (for "Working With" / manager roster). Safe to re-run.
-- -----------------------------------------------------------------------------
INSERT INTO public.mr_manager_map (mr_id, manager_id)
SELECT mr.id, mgr.id
FROM public.users mr
CROSS JOIN public.users mgr
WHERE mr.role::text = 'mr'
  AND mgr.role::text = 'manager'
  AND mgr.employee_code IN ('MKT-MGR-001', 'MKT-MGR-002')
  AND NOT EXISTS (
    SELECT 1
    FROM public.mr_manager_map m
    WHERE m.mr_id = mr.id AND m.manager_id = mgr.id
  );
