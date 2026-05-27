-- MR new-doctor requests (manager approval) + in-app notification feed.

-- 1) Doctor add requests
CREATE TABLE IF NOT EXISTS public.doctor_add_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sub_area_id uuid NOT NULL REFERENCES public.sub_areas(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payload jsonb NOT NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  manager_note text,
  approved_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_doctor_add_requests_manager ON public.doctor_add_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_doctor_add_requests_mr ON public.doctor_add_requests(mr_id);
CREATE INDEX IF NOT EXISTS idx_doctor_add_requests_sub_area ON public.doctor_add_requests(sub_area_id);
CREATE INDEX IF NOT EXISTS idx_doctor_add_requests_status ON public.doctor_add_requests(status);

ALTER TABLE public.doctor_add_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_add_select_scope ON public.doctor_add_requests;
CREATE POLICY doctor_add_select_scope ON public.doctor_add_requests
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR me.id = doctor_add_requests.mr_id
      OR me.id = doctor_add_requests.manager_id
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = doctor_add_requests.mr_id
        )
      )
    )
  )
);

DROP POLICY IF EXISTS doctor_add_insert_mr ON public.doctor_add_requests;
CREATE POLICY doctor_add_insert_mr ON public.doctor_add_requests
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (me.role::text = 'admin' OR (me.role::text = 'mr' AND me.id = doctor_add_requests.mr_id))
  )
);

DROP POLICY IF EXISTS doctor_add_update_scope ON public.doctor_add_requests;
CREATE POLICY doctor_add_update_scope ON public.doctor_add_requests
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true
    AND (
      me.role::text = 'admin'
      OR me.id = doctor_add_requests.manager_id
      OR (
        me.role::text = 'manager'
        AND EXISTS (
          SELECT 1 FROM public.mr_manager_map mm
          WHERE mm.manager_id = me.id AND mm.mr_id = doctor_add_requests.mr_id
        )
      )
    )
  )
);

GRANT SELECT, INSERT, UPDATE ON public.doctor_add_requests TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS doctor_add_one_pending_per_mr_subarea_name
  ON public.doctor_add_requests (mr_id, sub_area_id, ((payload -> 'doctor' ->> 'full_name')))
  WHERE (status = 'pending');

-- MRs add doctors only via approval RPC (not direct insert).
DROP POLICY IF EXISTS mr_insert_own_doctors ON public.doctors;

-- 2) User notifications (in-app + client push display)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL DEFAULT '/',
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON public.user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON public.user_notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notifications_select_own ON public.user_notifications;
CREATE POLICY user_notifications_select_own ON public.user_notifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true AND me.id = user_notifications.user_id
  )
);

DROP POLICY IF EXISTS user_notifications_update_own ON public.user_notifications;
CREATE POLICY user_notifications_update_own ON public.user_notifications
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true AND me.id = user_notifications.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users me
    WHERE me.auth_user_id = auth.uid() AND me.is_active = true AND me.id = user_notifications.user_id
  )
);

GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;

-- RPCs: see 20260526180100_doctor_add_requests_rpcs.sql
