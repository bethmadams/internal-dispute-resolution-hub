-- Per-case access grants for viewers
CREATE TABLE public.case_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dispute_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_access TO authenticated;
GRANT ALL ON public.case_access TO service_role;
ALTER TABLE public.case_access ENABLE ROW LEVEL SECURITY;

-- staff helper: admin or investigator
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','investigator'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_view_dispute(_dispute_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(_user_id)
    OR (_dispute_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.case_access ca
      WHERE ca.dispute_id = _dispute_id
        AND ca.user_id = _user_id
        AND (ca.expires_at IS NULL OR ca.expires_at > now())
    ))
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_dispute(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_view_dispute(uuid, uuid) TO authenticated, service_role;

CREATE POLICY case_access_select ON public.case_access FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY case_access_manage ON public.case_access FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Revoke all grants automatically when a case is closed
CREATE OR REPLACE FUNCTION public.revoke_case_access_on_close()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'Closed'::public.dispute_stage AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    DELETE FROM public.case_access WHERE dispute_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER disputes_revoke_access_on_close
AFTER UPDATE OF stage ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.revoke_case_access_on_close();

-- ===== Tighten policies: viewers read-only, per-case scoped =====

DROP POLICY IF EXISTS disputes_select ON public.disputes;
CREATE POLICY disputes_select ON public.disputes FOR SELECT TO authenticated
  USING (public.can_view_dispute(id, auth.uid()));
DROP POLICY IF EXISTS disputes_update ON public.disputes;
CREATE POLICY disputes_update ON public.disputes FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS disputes_insert ON public.disputes;
CREATE POLICY disputes_insert ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS notes_select ON public.dispute_notes;
CREATE POLICY notes_select ON public.dispute_notes FOR SELECT TO authenticated
  USING (public.can_view_dispute(dispute_id, auth.uid()));
DROP POLICY IF EXISTS notes_insert ON public.dispute_notes;
CREATE POLICY notes_insert ON public.dispute_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS responses_select ON public.dispute_responses;
CREATE POLICY responses_select ON public.dispute_responses FOR SELECT TO authenticated
  USING (public.can_view_dispute(dispute_id, auth.uid()));
DROP POLICY IF EXISTS responses_insert_staff ON public.dispute_responses;
CREATE POLICY responses_insert_staff ON public.dispute_responses FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS responses_update_staff ON public.dispute_responses;
CREATE POLICY responses_update_staff ON public.dispute_responses FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS appeals_select ON public.dispute_appeals;
CREATE POLICY appeals_select ON public.dispute_appeals FOR SELECT TO authenticated
  USING (public.can_view_dispute(dispute_id, auth.uid()));
DROP POLICY IF EXISTS appeals_insert_staff ON public.dispute_appeals;
CREATE POLICY appeals_insert_staff ON public.dispute_appeals FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS appeals_update_staff ON public.dispute_appeals;
CREATE POLICY appeals_update_staff ON public.dispute_appeals FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS attachments_select ON public.dispute_attachments;
CREATE POLICY attachments_select ON public.dispute_attachments FOR SELECT TO authenticated
  USING (
    public.can_view_dispute(dispute_id, auth.uid())
    OR (dispute_id IS NULL AND public.is_staff(auth.uid()))
  );
DROP POLICY IF EXISTS attachments_insert_staff ON public.dispute_attachments;
CREATE POLICY attachments_insert_staff ON public.dispute_attachments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS resources_insert ON public.resources;
CREATE POLICY resources_insert ON public.resources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff(auth.uid()));
DROP POLICY IF EXISTS resources_update ON public.resources;
CREATE POLICY resources_update ON public.resources FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));