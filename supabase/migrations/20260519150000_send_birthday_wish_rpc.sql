-- Secure birthday wish send (avoids RLS 403 on direct insert)

CREATE OR REPLACE FUNCTION public.send_birthday_wish(
  p_recipient_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_sender uuid;
  v_id uuid;
  v_msg text := trim(p_message);
BEGIN
  IF char_length(v_msg) = 0 OR char_length(v_msg) > 500 THEN
    RAISE EXCEPTION 'Wish must be between 1 and 500 characters';
  END IF;

  SELECT u.id INTO v_sender
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_recipient_id = v_sender THEN
    RAISE EXCEPTION 'You cannot send a birthday wish to yourself';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users r
    WHERE r.id = p_recipient_id
      AND r.is_active = true
      AND r.dob IS NOT NULL
      AND EXTRACT(MONTH FROM r.dob) = EXTRACT(MONTH FROM today_ist())
      AND EXTRACT(DAY FROM r.dob) = EXTRACT(DAY FROM today_ist())
  ) THEN
    RAISE EXCEPTION 'This person does not have a birthday today';
  END IF;

  INSERT INTO public.birthday_wishes (recipient_id, sender_id, message, wish_date)
  VALUES (p_recipient_id, v_sender, v_msg, today_ist())
  ON CONFLICT (recipient_id, sender_id, wish_date)
  DO UPDATE SET message = EXCLUDED.message, created_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_birthday_wish(uuid, text) TO authenticated;
