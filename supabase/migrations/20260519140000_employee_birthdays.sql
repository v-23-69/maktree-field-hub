-- Employee birthdays: wishes table + RPCs (IST day match on users.dob)

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dob date;

CREATE TABLE IF NOT EXISTS public.birthday_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  wish_date date NOT NULL DEFAULT today_ist(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT birthday_wishes_message_len CHECK (
    char_length(trim(message)) > 0 AND char_length(message) <= 500
  ),
  CONSTRAINT birthday_wishes_unique_per_day UNIQUE (recipient_id, sender_id, wish_date)
);

CREATE INDEX IF NOT EXISTS birthday_wishes_recipient_date_idx
  ON public.birthday_wishes (recipient_id, wish_date DESC);

ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS birthday_wishes_select ON public.birthday_wishes;
CREATE POLICY birthday_wishes_select ON public.birthday_wishes
  FOR SELECT TO authenticated
  USING (
    wish_date = today_ist()
    AND EXISTS (
      SELECT 1 FROM public.users me
      WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    )
  );

DROP POLICY IF EXISTS birthday_wishes_insert ON public.birthday_wishes;
CREATE POLICY birthday_wishes_insert ON public.birthday_wishes
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      LIMIT 1
    )
    AND wish_date = today_ist()
    AND EXISTS (
      SELECT 1 FROM public.users r
      WHERE r.id = recipient_id
        AND r.is_active = true
        AND r.dob IS NOT NULL
        AND EXTRACT(MONTH FROM r.dob) = EXTRACT(MONTH FROM today_ist())
        AND EXTRACT(DAY FROM r.dob) = EXTRACT(DAY FROM today_ist())
    )
  );

CREATE OR REPLACE FUNCTION public.get_employees_birthday_today()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  role text,
  designation text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT
    u.id AS user_id,
    u.full_name,
    u.role::text AS role,
    u.designation,
    u.profile_photo_url
  FROM public.users u
  WHERE u.is_active = true
    AND u.role::text IN ('mr', 'manager', 'admin')
    AND u.dob IS NOT NULL
    AND EXTRACT(MONTH FROM u.dob) = EXTRACT(MONTH FROM today_ist())
    AND EXTRACT(DAY FROM u.dob) = EXTRACT(DAY FROM today_ist())
  ORDER BY u.full_name;
$$;

CREATE OR REPLACE FUNCTION public.get_birthday_wishes_today(p_recipient_id uuid)
RETURNS TABLE(
  id uuid,
  message text,
  created_at timestamptz,
  sender_id uuid,
  sender_name text,
  sender_role text,
  sender_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT
    w.id,
    w.message,
    w.created_at,
    w.sender_id,
    s.full_name AS sender_name,
    s.role::text AS sender_role,
    s.profile_photo_url AS sender_photo_url
  FROM public.birthday_wishes w
  JOIN public.users s ON s.id = w.sender_id
  WHERE w.recipient_id = p_recipient_id
    AND w.wish_date = today_ist()
  ORDER BY w.created_at DESC;
$$;

GRANT SELECT, INSERT ON public.birthday_wishes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employees_birthday_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_birthday_wishes_today(uuid) TO authenticated;
