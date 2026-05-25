-- Safe FK-supporting indexes (IF NOT EXISTS). No drops. Reversible via 20260526150100 rollback.
-- Improves join/filter on high-volume child tables.

CREATE INDEX IF NOT EXISTS idx_expense_items_report_id
  ON public.expense_items (expense_report_id);

CREATE INDEX IF NOT EXISTS idx_report_visits_report_id
  ON public.report_visits (report_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_mr_id
  ON public.leave_requests (mr_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_id
  ON public.leave_requests (manager_id);

CREATE INDEX IF NOT EXISTS idx_tour_program_entries_program_date
  ON public.tour_program_entries (tour_program_id, work_date);
