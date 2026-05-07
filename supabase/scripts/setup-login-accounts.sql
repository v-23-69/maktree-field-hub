-- Setup/login alignment for known users.
-- Run in Supabase SQL editor after creating/resetting these auth users in Authentication:
-- arunkhadul@gmail.com, kandedheeraj@gmail.com, wadekarmanoj13@gmail.com, srkvi5531@gmail.com, vishal5952v@gmail.com

WITH mapping(email, full_name, role) AS (
  VALUES
    ('arunkhadul@gmail.com', 'Arun Khadul', 'mr'),
    ('kandedheeraj@gmail.com', 'Dheeraj Khande', 'mr'),
    ('wadekarmanoj13@gmail.com', 'Manoj Wadekar', 'manager'),
    ('srkvi5531@gmail.com', 'Kiran Wadekar', 'manager'),
    ('vishal5952v@gmail.com', 'Admin Vishal', 'admin')
),
auth_rows AS (
  SELECT au.id AS auth_user_id, lower(trim(au.email::text)) AS email
  FROM auth.users au
  INNER JOIN mapping m ON lower(trim(au.email::text)) = lower(trim(m.email))
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
  -- Fill employee_code later if you have strict format requirements.
  upper(replace(split_part(m.email, '@', 1), '.', '-')),
  m.full_name,
  a.email,
  m.role,
  true,
  a.auth_user_id,
  now(),
  now()
FROM auth_rows a
INNER JOIN mapping m ON m.email = a.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE lower(trim(u.email)) = a.email
);

WITH mapping(email, full_name, role) AS (
  VALUES
    ('arunkhadul@gmail.com', 'Arun Khadul', 'mr'),
    ('kandedheeraj@gmail.com', 'Dheeraj Khande', 'mr'),
    ('wadekarmanoj13@gmail.com', 'Manoj Wadekar', 'manager'),
    ('srkvi5531@gmail.com', 'Kiran Wadekar', 'manager'),
    ('vishal5952v@gmail.com', 'Admin Vishal', 'admin')
)
UPDATE public.users u
SET
  full_name = m.full_name,
  role = m.role,
  is_active = true,
  auth_user_id = au.id,
  updated_at = now()
FROM mapping m
INNER JOIN auth.users au
  ON lower(trim(au.email::text)) = lower(trim(m.email))
WHERE lower(trim(u.email)) = lower(trim(m.email));

-- Verification
SELECT u.full_name, u.email, u.role, u.is_active, u.auth_user_id, au.email AS auth_email
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.auth_user_id
WHERE lower(trim(u.email)) IN (
  'arunkhadul@gmail.com',
  'kandedheeraj@gmail.com',
  'wadekarmanoj13@gmail.com',
  'srkvi5531@gmail.com',
  'vishal5952v@gmail.com'
)
ORDER BY u.role, u.full_name;
