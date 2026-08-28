-- Allow without_pay on manager self-leave (UI already offers it; leave_requests had this since 20260529).
ALTER TABLE public.manager_leave_entries
  DROP CONSTRAINT IF EXISTS manager_leave_entries_leave_category_check;

ALTER TABLE public.manager_leave_entries
  ADD CONSTRAINT manager_leave_entries_leave_category_check
  CHECK (leave_category = ANY (ARRAY['casual'::text, 'sick'::text, 'without_pay'::text]));
