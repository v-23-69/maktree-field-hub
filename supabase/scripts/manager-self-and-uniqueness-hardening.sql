-- 1) Ensure managers can be assigned to sub-areas like MRs (self-reporting support).
-- If unique constraints already exist, IF NOT EXISTS avoids duplicate errors.

CREATE UNIQUE INDEX IF NOT EXISTS ux_mr_manager_map_mr_manager
  ON public.mr_manager_map (mr_id, manager_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_mr_sub_area_access_mr_subarea
  ON public.mr_sub_area_access (mr_id, sub_area_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_daily_reports_mr_date
  ON public.daily_reports (mr_id, report_date);

CREATE UNIQUE INDEX IF NOT EXISTS ux_expense_reports_mr_date
  ON public.expense_reports (mr_id, report_date);

-- Optional profile field support hardening (safe re-run)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pan_number text;

-- Optional: check current manager self-assignment rows
-- SELECT u.id, u.full_name, msa.sub_area_id
-- FROM public.users u
-- LEFT JOIN public.mr_sub_area_access msa ON msa.mr_id = u.id
-- WHERE u.role::text = 'manager'
-- ORDER BY u.full_name;
