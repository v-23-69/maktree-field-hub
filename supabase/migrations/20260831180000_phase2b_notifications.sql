-- Phase 2B: notify all mapped managers, fill missing notification triggers, deep-link URLs.

-- ---------------------------------------------------------------------------
-- submit_doctor_add_request → all mapped managers + deep link
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_doctor_add_request(
  p_mr_id uuid,
  p_sub_area_id uuid,
  p_manager_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_id uuid;
  v_role text;
  v_name text;
  v_req_id uuid;
  v_mgr uuid;
  v_url text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me_id := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me_id IS NULL THEN
    RAISE EXCEPTION 'Active user profile not found';
  END IF;

  IF v_role NOT IN ('admin', 'mr') OR (v_role = 'mr' AND v_me_id <> p_mr_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = p_mr_id AND msa.sub_area_id = p_sub_area_id
  ) THEN
    RAISE EXCEPTION 'You are not assigned to this sub-area';
  END IF;

  v_name := trim(COALESCE(p_payload -> 'doctor' ->> 'full_name', ''));
  IF length(v_name) < 1 THEN
    RAISE EXCEPTION 'Doctor name is required';
  END IF;

  IF trim(COALESCE(p_payload -> 'doctor' ->> 'speciality', '')) = '' THEN
    RAISE EXCEPTION 'Speciality is required';
  END IF;

  v_mgr := p_manager_id;
  IF v_mgr IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.mr_manager_map mm
    WHERE mm.mr_id = p_mr_id AND mm.manager_id = v_mgr
  ) THEN
    v_mgr := NULL;
  END IF;

  IF v_mgr IS NULL THEN
    v_mgr := public.primary_manager_for_mr(p_mr_id);
  END IF;

  IF v_mgr IS NULL THEN
    RAISE EXCEPTION 'No manager is assigned to your account. Contact admin.';
  END IF;

  INSERT INTO public.doctor_add_requests (mr_id, manager_id, sub_area_id, status, payload)
  VALUES (p_mr_id, v_mgr, p_sub_area_id, 'pending', p_payload)
  RETURNING id INTO v_req_id;

  v_url := '/manager/requests?tab=doctor-add&requestId=' || v_req_id::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      p_mr_id,
      'doctor_add_request',
      'New doctor to approve',
      'New doctor: ' || v_name || ' — tap to review and approve.',
      v_url,
      jsonb_build_object('request_id', v_req_id, 'kind', 'doctor_add', 'mr_id', p_mr_id, 'tab', 'doctor-add')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_req_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- leave request deep links (URL only change)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_leave_dcr_request(
  p_mr_id uuid,
  p_leave_date date,
  p_remark text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mr_name text;
  v_leave_id uuid;
  v_mgr uuid;
  v_existing uuid;
  v_url text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_me := public.session_profile_id();
  v_role := public.current_user_role();

  IF v_me IS NULL OR (v_role = 'mr' AND v_me <> p_mr_id) OR v_role NOT IN ('mr', 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF trim(COALESCE(p_remark, '')) = '' THEN
    RAISE EXCEPTION 'Remark is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.daily_reports
    WHERE mr_id = p_mr_id AND report_date = p_leave_date AND status = 'submitted'
  ) THEN
    RAISE EXCEPTION 'A report for this date is already submitted';
  END IF;

  SELECT id INTO v_existing
  FROM public.leave_requests
  WHERE mr_id = p_mr_id AND leave_date = p_leave_date AND status = 'pending'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'A pending leave request already exists for this date';
  END IF;

  SELECT manager_id INTO v_mgr
  FROM public.mr_manager_map
  WHERE mr_id = p_mr_id
  ORDER BY assigned_at ASC NULLS LAST
  LIMIT 1;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = p_mr_id;

  INSERT INTO public.leave_requests (
    mr_id, manager_id, leave_date, leave_type, leave_category, reason, status
  ) VALUES (
    p_mr_id, v_mgr, p_leave_date, 'full', 'without_pay', trim(p_remark), 'pending'
  )
  RETURNING id INTO v_leave_id;

  v_url := '/manager/leaves?leaveId=' || v_leave_id::text;

  PERFORM public._notify_mr_managers(
    p_mr_id,
    'leave_request',
    'Leave request',
    COALESCE(v_mr_name, 'Team member') || ' requested leave without pay for ' || to_char(p_leave_date, 'DD Mon YYYY') || '.',
    v_url,
    jsonb_build_object('leave_id', v_leave_id, 'mr_id', p_mr_id, 'leave_date', p_leave_date, 'status', 'pending')
  );

  RETURN v_leave_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- DCR submitted deep links
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_dcr_submitted_to_manager(
  p_mr_id uuid,
  p_report_date text,
  p_manager_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
  v_url text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = p_mr_id;
  v_url := '/manager/reports?mrId=' || p_mr_id::text || '&date=' || p_report_date || '&view=1';

  IF p_manager_id IS NOT NULL THEN
    BEGIN
      PERFORM public._notify_user(
        p_manager_id,
        'dcr_submitted',
        'DCR submitted',
        COALESCE(v_mr_name, 'Team member') || ' submitted DCR for ' || p_report_date || '.',
        v_url,
        jsonb_build_object('mr_id', p_mr_id, 'report_date', p_report_date)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  PERFORM public._notify_mr_managers(
    p_mr_id,
    'dcr_submitted',
    'DCR submitted',
    COALESCE(v_mr_name, 'Team member') || ' submitted DCR for ' || p_report_date || '.',
    v_url,
    jsonb_build_object('mr_id', p_mr_id, 'report_date', p_report_date),
    p_manager_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- late DCR request → all mapped managers + deep link
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_late_dcr_fill(p_dates date[])
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_me uuid;
  v_request_id uuid;
  v_role text;
  v_manager uuid;
  v_active int;
  v_date date;
  v_clean date[] := '{}';
  v_cutoff date := today_ist() - 3;
  v_allowed date[];
  v_mr_name text;
  v_url text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role <> 'mr' THEN
    RAISE EXCEPTION 'Only MRs submit late DCR requests. Managers can grant dates directly.';
  END IF;

  v_active := public.count_active_late_fill_slots(v_me);
  IF v_active > 0 THEN
    RAISE EXCEPTION 'Complete your % pending late DCR(s) before requesting more.', v_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dcr_late_fill_requests
    WHERE mr_id = v_me AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending late DCR request';
  END IF;

  IF p_dates IS NULL OR cardinality(p_dates) = 0 THEN
    RAISE EXCEPTION 'Select at least one date';
  END IF;

  IF cardinality(p_dates) > 15 THEN
    RAISE EXCEPTION 'You can request at most 15 dates at a time';
  END IF;

  SELECT array_agg(d ORDER BY d)
  INTO v_allowed
  FROM public.get_next_missed_late_batch_dates(v_me, 15) AS d;

  IF v_allowed IS NULL OR cardinality(v_allowed) = 0 THEN
    RAISE EXCEPTION 'No missed DCR dates available to request';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    IF v_date > v_cutoff THEN
      RAISE EXCEPTION 'Date % is still in the normal filing window', v_date;
    END IF;
    IF NOT (v_date = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'Date % is not in your current batch of requestable missed days', v_date;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.mr_id = v_me AND dr.report_date = v_date AND dr.status = 'submitted'
    ) THEN
      CONTINUE;
    END IF;
    IF v_date = ANY (v_clean) THEN
      CONTINUE;
    END IF;
    v_clean := array_append(v_clean, v_date);
  END LOOP;

  IF cardinality(v_clean) = 0 THEN
    RAISE EXCEPTION 'No eligible dates selected';
  END IF;

  SELECT mm.manager_id INTO v_manager
  FROM public.mr_manager_map mm
  WHERE mm.mr_id = v_me
  ORDER BY mm.assigned_at ASC
  LIMIT 1;

  IF v_manager IS NULL THEN
    RAISE EXCEPTION 'No manager assigned';
  END IF;

  INSERT INTO public.dcr_late_fill_requests (mr_id, manager_id, requested_dates)
  VALUES (v_me, v_manager, v_clean)
  RETURNING id INTO v_request_id;

  v_url := '/manager/requests?tab=late-dcr&requestId=' || v_request_id::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      v_me,
      'late_dcr_request',
      'Late DCR approval needed',
      COALESCE(v_mr_name, 'An MR') || ' requested late DCR approval for '
        || cardinality(v_clean)::text || ' missed day(s).',
      v_url,
      jsonb_build_object('request_id', v_request_id, 'mr_id', v_me, 'requested_dates', v_clean, 'tab', 'late-dcr')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_request_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- tour program deletion request + resolve notifications
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_tour_program_deletion(p_tour_program_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_tp_mr uuid;
  v_id uuid;
  v_mr_name text;
  v_month text;
  v_url text;
BEGIN
  SELECT u.id, u.role::text INTO v_me, v_role
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_role <> 'mr' THEN RAISE EXCEPTION 'Only MR accounts request tour program deletion'; END IF;

  SELECT tp.mr_id, to_char(tp.month, 'YYYY-MM') INTO v_tp_mr, v_month
  FROM public.tour_programs tp
  WHERE tp.id = p_tour_program_id
  LIMIT 1;

  IF v_tp_mr IS NULL THEN RAISE EXCEPTION 'Tour program not found'; END IF;
  IF v_tp_mr <> v_me THEN RAISE EXCEPTION 'Not your tour program'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.tour_program_deletion_requests r
    WHERE r.tour_program_id = p_tour_program_id AND r.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A deletion request is already pending for this tour program';
  END IF;

  INSERT INTO public.tour_program_deletion_requests (tour_program_id, mr_id, status)
  VALUES (p_tour_program_id, v_me, 'pending')
  RETURNING id INTO v_id;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = v_me;
  v_url := '/manager/requests?tab=tp-deletion&requestId=' || v_id::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      v_me,
      'tp_deletion_request',
      'Tour program deletion',
      COALESCE(v_mr_name, 'Team member') || ' requested deletion of tour program for ' || COALESCE(v_month, 'a month') || '.',
      v_url,
      jsonb_build_object('request_id', v_id, 'tour_program_id', p_tour_program_id, 'mr_id', v_me, 'tab', 'tp-deletion')
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_tour_program_deletion_request(
  p_request_id uuid,
  p_approve boolean,
  p_manager_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mgr_name text;
  r record;
  v_month text;
BEGIN
  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_role NOT IN ('manager', 'admin') THEN RAISE EXCEPTION 'Only managers or admins can resolve'; END IF;

  SELECT r.* INTO r
  FROM public.tour_program_deletion_requests r
  WHERE r.id = p_request_id
  FOR UPDATE;

  IF r IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;

  SELECT to_char(tp.month, 'YYYY-MM') INTO v_month
  FROM public.tour_programs tp
  WHERE tp.id = r.tour_program_id;

  IF v_role <> 'admin' THEN
    IF r.mr_id <> v_me AND NOT EXISTS (
      SELECT 1 FROM public.mr_manager_map mm
      WHERE mm.manager_id = v_me AND mm.mr_id = r.mr_id
    ) THEN
      RAISE EXCEPTION 'Not allowed to resolve this request';
    END IF;
  END IF;

  v_month := COALESCE(v_month, 'the month');

  IF p_approve AND r.tour_program_id IS NOT NULL THEN
    PERFORM public._delete_tour_program_by_id(r.tour_program_id);
  END IF;

  IF p_approve THEN
    UPDATE public.tour_program_deletion_requests
    SET status = 'approved', manager_note = p_manager_note, resolved_by = v_me, resolved_at = now()
    WHERE id = p_request_id;

    BEGIN
      PERFORM public._notify_user(
        r.mr_id,
        'tp_deletion_approved',
        'Tour program deletion approved',
        COALESCE(v_mgr_name, 'Your manager') || ' approved deleting your tour program for ' || COALESCE(v_month, 'the month') || '.',
        '/mr/tour-program',
        jsonb_build_object('request_id', p_request_id, 'tour_program_id', r.tour_program_id)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  ELSE
    UPDATE public.tour_program_deletion_requests
    SET status = 'rejected', manager_note = p_manager_note, resolved_by = v_me, resolved_at = now()
    WHERE id = p_request_id;

    BEGIN
      PERFORM public._notify_user(
        r.mr_id,
        'tp_deletion_rejected',
        'Tour program deletion declined',
        COALESCE(v_mgr_name, 'Your manager') || ' declined your tour program deletion request.',
        '/mr/tour-program',
        jsonb_build_object('request_id', p_request_id, 'tour_program_id', r.tour_program_id)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- unlock resolve → notify MR
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_report_unlock_request(
  p_request_id uuid,
  p_action text,
  p_manager_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_role text;
  v_mgr_name text;
  v_req record;
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT u.id, u.role::text, u.full_name INTO v_me, v_role, v_mgr_name
  FROM public.users u
  WHERE u.auth_user_id = auth.uid() AND u.is_active = true
  LIMIT 1;

  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT r.id, r.mr_id, r.manager_id, r.status
  INTO v_req
  FROM public.report_unlock_requests r
  WHERE r.id = p_request_id
  FOR UPDATE;

  IF v_req IS NULL OR v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  IF v_role <> 'admin' AND v_req.manager_id <> v_me THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  UPDATE public.report_unlock_requests r
  SET
    status = p_action,
    manager_comment = CASE
      WHEN p_action = 'rejected' THEN NULLIF(trim(p_manager_comment), '')
      ELSE NULL
    END,
    resolved_at = now()
  WHERE r.id = p_request_id;

  IF p_action = 'approved' THEN
    BEGIN
      PERFORM public._notify_user(
        v_req.mr_id,
        'unlock_approved',
        'DCR filing unlocked',
        COALESCE(v_mgr_name, 'Your manager') || ' approved your request to file DCR again.',
        '/mr/report/new',
        jsonb_build_object('request_id', p_request_id)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  ELSE
    BEGIN
      PERFORM public._notify_user(
        v_req.mr_id,
        'unlock_rejected',
        'Unlock request declined',
        COALESCE(v_mgr_name, 'Your manager') || ' declined your DCR unlock request.'
          || CASE
            WHEN NULLIF(trim(p_manager_comment), '') IS NOT NULL
            THEN ' Note: ' || trim(p_manager_comment)
            ELSE ''
          END,
        '/mr/dashboard',
        jsonb_build_object('request_id', p_request_id)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: doctor deletion, unlock submit, expense submit, tour program submit/resolve
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notify_doctor_deletion_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
  v_doc_name text;
  v_url text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = NEW.mr_id;
  SELECT full_name INTO v_doc_name FROM public.doctors WHERE id = NEW.doctor_id;
  v_url := '/manager/requests?tab=doctor-removal&requestId=' || NEW.id::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      NEW.mr_id,
      'doctor_deletion_request',
      'Doctor removal request',
      COALESCE(v_mr_name, 'Team member') || ' requested removal of ' || COALESCE(v_doc_name, 'a doctor') || '.',
      v_url,
      jsonb_build_object('request_id', NEW.id, 'doctor_id', NEW.doctor_id, 'mr_id', NEW.mr_id, 'tab', 'doctor-removal')
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_doctor_deletion_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_name text;
  v_mgr_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    SELECT full_name INTO v_doc_name FROM public.doctors WHERE id = NEW.doctor_id;
    SELECT u.full_name INTO v_mgr_name
    FROM public.users u
    WHERE u.id = NEW.approved_by;

    IF NEW.status = 'approved' THEN
      BEGIN
        PERFORM public._notify_user(
          NEW.mr_id,
          'doctor_deletion_approved',
          'Doctor removal approved',
          COALESCE(v_doc_name, 'Doctor') || ' was removed from your list.',
          '/mr/master-list',
          jsonb_build_object('request_id', NEW.id, 'doctor_id', NEW.doctor_id)
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    ELSE
      BEGIN
        PERFORM public._notify_user(
          NEW.mr_id,
          'doctor_deletion_rejected',
          'Doctor removal declined',
          COALESCE(v_mgr_name, 'Your manager') || ' did not approve removing ' || COALESCE(v_doc_name, 'this doctor') || '.',
          '/mr/master-list',
          jsonb_build_object('request_id', NEW.id, 'doctor_id', NEW.doctor_id)
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_deletion_request_notify ON public.doctor_deletion_requests;
CREATE TRIGGER trg_doctor_deletion_request_notify
  AFTER INSERT ON public.doctor_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_doctor_deletion_request();

DROP TRIGGER IF EXISTS trg_doctor_deletion_resolved_notify ON public.doctor_deletion_requests;
CREATE TRIGGER trg_doctor_deletion_resolved_notify
  AFTER UPDATE OF status ON public.doctor_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_doctor_deletion_resolved();

CREATE OR REPLACE FUNCTION public.trg_notify_report_unlock_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
  v_url text;
BEGIN
  SELECT full_name INTO v_mr_name FROM public.users WHERE id = NEW.mr_id;
  v_url := '/manager/requests?tab=unlock&requestId=' || NEW.id::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      NEW.mr_id,
      'unlock_request',
      'DCR unlock request',
      COALESCE(v_mr_name, 'Team member') || ' is blocked from filing DCR and needs unlock approval.',
      v_url,
      jsonb_build_object('request_id', NEW.id, 'mr_id', NEW.mr_id, 'tab', 'unlock')
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_unlock_request_notify ON public.report_unlock_requests;
CREATE TRIGGER trg_report_unlock_request_notify
  AFTER INSERT ON public.report_unlock_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_report_unlock_request();

CREATE OR REPLACE FUNCTION public.trg_notify_expense_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
  v_url text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM 'submitted' OR NEW.status <> 'submitted' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_mr_name FROM public.users WHERE id = NEW.mr_id;
  v_url := '/manager/reports?tab=expenses&mrId=' || NEW.mr_id::text || '&date=' || NEW.report_date::text;

  BEGIN
    PERFORM public._notify_mr_managers(
      NEW.mr_id,
      'expense_submitted',
      'Expense report submitted',
      COALESCE(v_mr_name, 'Team member') || ' submitted expenses for ' || to_char(NEW.report_date, 'DD Mon YYYY') || '.',
      v_url,
      jsonb_build_object('expense_report_id', NEW.id, 'mr_id', NEW.mr_id, 'report_date', NEW.report_date)
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expense_submitted_notify ON public.expense_reports;
CREATE TRIGGER trg_expense_submitted_notify
  AFTER UPDATE OF status ON public.expense_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_expense_submitted();

CREATE OR REPLACE FUNCTION public.trg_notify_tour_program_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mr_name text;
  v_mgr_name text;
  v_month text;
  v_url text;
BEGIN
  v_month := to_char(NEW.month, 'YYYY-MM');

  IF OLD.status IS NOT DISTINCT FROM 'submitted' AND NEW.status = 'submitted' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    SELECT full_name INTO v_mr_name FROM public.users WHERE id = NEW.mr_id;
    v_url := '/manager/requests?tab=tour-program&requestId=' || NEW.id::text;

    BEGIN
      PERFORM public._notify_mr_managers(
        NEW.mr_id,
        'tour_program_request',
        'Tour program submitted',
        COALESCE(v_mr_name, 'Team member') || ' submitted a tour program for ' || v_month || '.',
        v_url,
        jsonb_build_object('tour_program_id', NEW.id, 'mr_id', NEW.mr_id, 'month', v_month, 'tab', 'tour-program')
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN NEW;
  END IF;

  IF OLD.status = 'submitted' AND NEW.status IN ('approved', 'rejected') THEN
    SELECT u.full_name INTO v_mgr_name
    FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true
    LIMIT 1;

    IF NEW.status = 'approved' THEN
      BEGIN
        PERFORM public._notify_user(
          NEW.mr_id,
          'tour_program_approved',
          'Tour program approved',
          COALESCE(v_mgr_name, 'Your manager') || ' approved your tour program for ' || v_month || '.',
          '/mr/tour-program',
          jsonb_build_object('tour_program_id', NEW.id, 'month', v_month)
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    ELSE
      BEGIN
        PERFORM public._notify_user(
          NEW.mr_id,
          'tour_program_rejected',
          'Tour program declined',
          COALESCE(v_mgr_name, 'Your manager') || ' declined your tour program for ' || v_month || '.',
          '/mr/tour-program',
          jsonb_build_object('tour_program_id', NEW.id, 'month', v_month)
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tour_program_status_notify ON public.tour_programs;
CREATE TRIGGER trg_tour_program_status_notify
  AFTER UPDATE OF status ON public.tour_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_tour_program_status();
