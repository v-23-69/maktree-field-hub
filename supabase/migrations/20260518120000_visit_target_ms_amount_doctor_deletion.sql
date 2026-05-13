-- Default monthly visit target 2; monthly_support line totals; doctor removal requests.

-- 1) Doctors: default 2, set all existing active doctors to target 2 (per product request)
ALTER TABLE public.doctors
  ALTER COLUMN monthly_visit_target SET DEFAULT 2;

UPDATE public.doctors
SET monthly_visit_target = 2
WHERE is_active = true;

-- 2) Monthly support: persist computed rupee line total (PTR × qty at save time)
ALTER TABLE public.monthly_support_entries
  ADD COLUMN IF NOT EXISTS amount_inr numeric(14, 2) NOT NULL DEFAULT 0;

UPDATE public.monthly_support_entries mse
SET amount_inr = COALESCE(
  (SELECT p.ptr::numeric * mse.quantity::numeric FROM public.products p WHERE p.id = mse.product_id),
  0
)
WHERE amount_inr = 0 OR amount_inr IS NULL;

-- 3) MR requests to remove a doctor (manager approves → doctor deactivated)
CREATE TABLE IF NOT EXISTS public.doctor_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  manager_note text,
  approved_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_doctor_deletion_requests_manager ON public.doctor_deletion_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_doctor_deletion_requests_mr ON public.doctor_deletion_requests(mr_id);
CREATE INDEX IF NOT EXISTS idx_doctor_deletion_requests_status ON public.doctor_deletion_requests(status);

ALTER TABLE public.doctor_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_deletion_select_scope ON public.doctor_deletion_requests;
CREATE POLICY doctor_deletion_select_scope ON public.doctor_deletion_requests
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR me.id = doctor_deletion_requests.mr_id
      OR me.id = doctor_deletion_requests.manager_id
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = doctor_deletion_requests.mr_id
        )
      )
    )
  )
);

DROP POLICY IF EXISTS doctor_deletion_insert_mr ON public.doctor_deletion_requests;
CREATE POLICY doctor_deletion_insert_mr ON public.doctor_deletion_requests
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (me.role::text = 'admin' OR (me.role::text = 'mr' AND me.id = doctor_deletion_requests.mr_id))
  )
);

DROP POLICY IF EXISTS doctor_deletion_update_scope ON public.doctor_deletion_requests;
CREATE POLICY doctor_deletion_update_scope ON public.doctor_deletion_requests
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR me.id = doctor_deletion_requests.manager_id
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = doctor_deletion_requests.mr_id
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR me.id = doctor_deletion_requests.manager_id
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = doctor_deletion_requests.mr_id
        )
      )
    )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.doctor_deletion_requests TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS doctor_deletion_one_pending_per_doctor
  ON public.doctor_deletion_requests (doctor_id)
  WHERE (status = 'pending');
