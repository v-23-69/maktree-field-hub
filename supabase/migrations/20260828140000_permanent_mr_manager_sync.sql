-- Dual-manager org: keep every active MR linked to every active manager.
-- Survives admin UI saves that overwrite mr_manager_map with a single manager.

CREATE OR REPLACE FUNCTION public.sync_active_mr_manager_links(p_mr_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mr_manager_map (mr_id, manager_id)
  SELECT mr.id, mgr.id
  FROM public.users mr
  JOIN public.users mgr
    ON mgr.role = 'manager'
   AND mgr.is_active = true
   AND COALESCE(mgr.is_resigned, false) = false
   AND COALESCE(mgr.is_blocked, false) = false
  WHERE mr.role = 'mr'
    AND mr.is_active = true
    AND COALESCE(mr.is_resigned, false) = false
    AND (p_mr_id IS NULL OR mr.id = p_mr_id)
  ON CONFLICT (mr_id, manager_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_mr_manager_links_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'mr'
     AND NEW.is_active = true
     AND COALESCE(NEW.is_resigned, false) = false THEN
    PERFORM public.sync_active_mr_manager_links(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_mr_manager_links_from_map()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_id uuid := COALESCE(NEW.mr_id, OLD.mr_id);
BEGIN
  IF v_mr_id IS NOT NULL THEN
    PERFORM public.sync_active_mr_manager_links(v_mr_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_sync_mr_manager_links ON public.users;
CREATE TRIGGER trg_users_sync_mr_manager_links
AFTER INSERT OR UPDATE OF is_active, is_resigned, role ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_mr_manager_links_from_user();

DROP TRIGGER IF EXISTS trg_mr_manager_map_sync_links ON public.mr_manager_map;
CREATE TRIGGER trg_mr_manager_map_sync_links
AFTER INSERT OR UPDATE OR DELETE ON public.mr_manager_map
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_mr_manager_links_from_map();

SELECT public.sync_active_mr_manager_links();

REVOKE ALL ON FUNCTION public.sync_active_mr_manager_links(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_active_mr_manager_links(uuid) TO authenticated;
