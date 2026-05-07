-- Align known login accounts (email/role/auth_user_id) and manager mappings.
-- This migration is idempotent and safe to re-run.

WITH mapping(email, full_name, role_name) AS (
  VALUES
    ('arunkhadul@gmail.com', 'Arun Khadul', 'mr'),
    ('kandedheeraj@gmail.com', 'Dheeraj Khande', 'mr'),
    ('wadekarmanoj13@gmail.com', 'Manoj Wadekar', 'manager'),
    ('srkvi5531@gmail.com', 'Kiran Wadekar', 'manager'),
    ('vishal5952v@gmail.com', 'Vishal', 'admin')
)
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
  upper(replace(split_part(m.email, '@', 1), '.', '-')),
  m.full_name,
  lower(trim(au.email::text)),
  m.role_name,
  true,
  au.id,
  now(),
  now()
FROM mapping m
JOIN auth.users au ON lower(trim(au.email::text)) = lower(trim(m.email))
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE lower(trim(u.email::text)) = lower(trim(m.email))
);

WITH mapping(email, full_name, role_name) AS (
  VALUES
    ('arunkhadul@gmail.com', 'Arun Khadul', 'mr'),
    ('kandedheeraj@gmail.com', 'Dheeraj Khande', 'mr'),
    ('wadekarmanoj13@gmail.com', 'Manoj Wadekar', 'manager'),
    ('srkvi5531@gmail.com', 'Kiran Wadekar', 'manager'),
    ('vishal5952v@gmail.com', 'Vishal', 'admin')
)
UPDATE public.users u
SET
  full_name = m.full_name,
  email = lower(trim(m.email)),
  role = m.role_name,
  is_active = true,
  auth_user_id = au.id,
  is_blocked = false,
  block_reason = NULL,
  updated_at = now()
FROM mapping m
JOIN auth.users au ON lower(trim(au.email::text)) = lower(trim(m.email))
WHERE lower(trim(u.email::text)) = lower(trim(m.email));

WITH mrs AS (
  SELECT id
  FROM public.users
  WHERE lower(trim(email::text)) IN ('arunkhadul@gmail.com', 'kandedheeraj@gmail.com')
),
managers AS (
  SELECT id
  FROM public.users
  WHERE lower(trim(email::text)) IN ('wadekarmanoj13@gmail.com', 'srkvi5531@gmail.com')
)
INSERT INTO public.mr_manager_map (mr_id, manager_id)
SELECT mrs.id, managers.id
FROM mrs
CROSS JOIN managers
WHERE NOT EXISTS (
  SELECT 1
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = mrs.id AND mm.manager_id = managers.id
);
