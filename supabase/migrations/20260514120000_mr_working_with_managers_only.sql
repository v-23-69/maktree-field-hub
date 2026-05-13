-- MR daily report / tour "working with": managers only (no peer MRs).
-- Managers still see team MRs + peer managers.

CREATE OR REPLACE FUNCTION public.list_working_with_options_for_report()
RETURNS TABLE(id uuid, full_name text, employee_code text, role text, option_kind text, profile_photo_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth uuid := auth.uid();
  v_me_id uuid;
  v_role text;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT u.id, u.role::text INTO v_me_id, v_role
  FROM public.users u WHERE u.auth_user_id = v_auth AND u.is_active = true LIMIT 1;
  IF v_me_id IS NULL THEN RAISE EXCEPTION 'Active user profile not found'; END IF;

  IF v_role = 'manager' THEN
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'team_mr'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true
        AND u.id IN (SELECT mm.mr_id FROM public.mr_manager_map mm WHERE mm.manager_id = v_me_id)
      UNION ALL
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'peer_manager'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true AND u.role = 'manager' AND u.id != v_me_id
      ORDER BY option_kind, full_name;

  ELSIF v_role = 'mr' THEN
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text, 'linked_manager'::text AS option_kind, u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true
        AND u.id IN (SELECT mm.manager_id FROM public.mr_manager_map mm WHERE mm.mr_id = v_me_id)
      ORDER BY full_name;

  ELSE
    RETURN QUERY
      SELECT u.id, u.full_name, u.employee_code, u.role::text,
        CASE WHEN u.role = 'manager' THEN 'peer_manager'::text ELSE 'team_mr'::text END AS option_kind,
        u.profile_photo_url
      FROM public.users u
      WHERE u.is_active = true AND u.role IN ('mr','manager')
      ORDER BY u.role, u.full_name;
  END IF;
END;
$$;
