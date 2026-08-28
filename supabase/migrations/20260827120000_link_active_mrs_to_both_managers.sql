-- Dual-manager org: every active MR should be linked to every active manager.
-- Tushar was only mapped to Manoj Wadekar, so Kiran Wadekar never appeared in DCR Working with.

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
ON CONFLICT (mr_id, manager_id) DO NOTHING;
