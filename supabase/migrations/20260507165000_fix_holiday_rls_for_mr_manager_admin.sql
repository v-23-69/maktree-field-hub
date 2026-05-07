-- Fix RLS for holidays and MR holiday assignments so MR dashboard reads are allowed.

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS holidays_select_authenticated ON public.holidays;
CREATE POLICY holidays_select_authenticated
ON public.holidays
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS mr_holidays_select_by_role_scope ON public.mr_holidays;
CREATE POLICY mr_holidays_select_by_role_scope
ON public.mr_holidays
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.auth_user_id = auth.uid()
      AND (
        me.role::text = 'admin'
        OR me.id = mr_holidays.mr_id
        OR (
          me.role::text = 'manager'
          AND EXISTS (
            SELECT 1
            FROM public.mr_manager_map mm
            WHERE mm.manager_id = me.id
              AND mm.mr_id = mr_holidays.mr_id
          )
        )
      )
  )
);

GRANT SELECT ON public.holidays TO authenticated;
GRANT SELECT ON public.mr_holidays TO authenticated;
