CREATE TABLE public.case_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 phase text NOT NULL CHECK (phase IN ('Pre-hearing','Hearing','Post-hearing','Appeal')), title text NOT NULL, template_key text,
 assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, due_at timestamptz, completed_at timestamptz,
 evidence_note text NOT NULL DEFAULT '', completed_by uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(dispute_id, template_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_tasks TO authenticated;
GRANT ALL ON public.case_tasks TO service_role;
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_staff ON public.case_tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TABLE public.case_workflow (
 dispute_id uuid PRIMARY KEY REFERENCES public.disputes(id) ON DELETE CASCADE,
 mediation_broker text NOT NULL DEFAULT '', complaint_notified_at timestamptz, mediation_attempts text NOT NULL DEFAULT '', mediation_outcome text NOT NULL DEFAULT 'Not recorded',
 mediation_complete boolean NOT NULL DEFAULT false, regional_review_complete boolean NOT NULL DEFAULT false, voluntary_confirmed boolean NOT NULL DEFAULT false,
 binding_agreements_checked boolean NOT NULL DEFAULT false, enterprise_recorded boolean NOT NULL DEFAULT false, hubspot_recorded boolean NOT NULL DEFAULT false,
 paperwork_received_at timestamptz, hearing_notice_at timestamptz, meeting_location text NOT NULL DEFAULT '', meeting_duration_minutes integer NOT NULL DEFAULT 60 CHECK (meeting_duration_minutes > 0),
 decision_draft text NOT NULL DEFAULT '', decision_at timestamptz, director_ack_at timestamptz, broker_ack_at timestamptz, released_at timestamptz,
 released_decision text NOT NULL DEFAULT '', repayment_amount numeric, repayment_due_at timestamptz, repayment_received_at timestamptz, payout_at timestamptz,
 appeal_due_at timestamptz, appeal_new_information text NOT NULL DEFAULT '', appeal_unavailable_reason text NOT NULL DEFAULT '', appeal_outcome text NOT NULL DEFAULT 'Not recorded', appeal_decided_at timestamptz,
 ce_due_at timestamptz, ce_completed_at timestamptz, ce_certificate_note text NOT NULL DEFAULT '', followup_note text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.case_workflow TO authenticated;
GRANT ALL ON public.case_workflow TO service_role;
ALTER TABLE public.case_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_staff ON public.case_workflow FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TABLE public.case_panelists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 full_name text NOT NULL, email text NOT NULL DEFAULT '', licensed_states text[] NOT NULL DEFAULT '{}', team_licensed_states text[] NOT NULL DEFAULT '{}',
 approved boolean NOT NULL DEFAULT false, is_chair boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'Proposed' CHECK(status IN ('Proposed','Invited','Accepted','Declined')),
 challenge text NOT NULL DEFAULT '', challenge_outcome text NOT NULL DEFAULT 'None' CHECK(challenge_outcome IN ('None','Pending','Dismissed','Upheld')), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_panelists TO authenticated;
GRANT ALL ON public.case_panelists TO service_role;
ALTER TABLE public.case_panelists ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_staff ON public.case_panelists FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE UNIQUE INDEX panel_one_chair ON public.case_panelists(dispute_id) WHERE is_chair;
CREATE TABLE public.case_communications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 kind text NOT NULL, recipients text NOT NULL, subject text NOT NULL, body text NOT NULL DEFAULT '', sent_at timestamptz, recorded_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.case_communications TO authenticated;
GRANT ALL ON public.case_communications TO service_role;
ALTER TABLE public.case_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY communication_staff ON public.case_communications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TABLE public.case_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 actor_id uuid, action text NOT NULL, record_type text NOT NULL, before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.case_audit TO authenticated;
GRANT ALL ON public.case_audit TO service_role;
ALTER TABLE public.case_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_staff ON public.case_audit FOR SELECT TO authenticated USING(public.is_staff(auth.uid()));
ALTER TABLE public.disputes ADD COLUMN archived_at timestamptz;
ALTER TABLE public.dispute_attachments ADD COLUMN submitted_by_name text NOT NULL DEFAULT '', ADD COLUMN submitted_as text NOT NULL DEFAULT '', ADD COLUMN review_status text NOT NULL DEFAULT 'Pending', ADD COLUMN review_note text NOT NULL DEFAULT '', ADD COLUMN in_hearing_packet boolean NOT NULL DEFAULT false, ADD COLUMN visibility text NOT NULL DEFAULT 'case' CHECK(visibility IN ('case','staff'));
ALTER POLICY attachments_select ON public.dispute_attachments USING (public.is_staff(auth.uid()) OR (visibility = 'case' AND public.can_view_dispute(dispute_id, auth.uid())));
CREATE POLICY attachments_update_staff ON public.dispute_attachments FOR UPDATE TO authenticated USING(public.is_staff(auth.uid())) WITH CHECK(public.is_staff(auth.uid()));
ALTER POLICY dispute_files_staff_read ON storage.objects TO authenticated USING (bucket_id = 'dispute-files' AND (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.dispute_attachments a WHERE a.file_path = storage.objects.name AND a.visibility = 'case' AND public.can_view_dispute(a.dispute_id, auth.uid()))));
CREATE OR REPLACE FUNCTION public.validate_case_workflow() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.updated_at := now();
 IF NEW.released_at IS NOT NULL AND (NEW.director_ack_at IS NULL OR NEW.broker_ack_at IS NULL OR trim(NEW.released_decision) = '') THEN RAISE EXCEPTION 'Director and broker acknowledgments and a decision are required before release'; END IF;
 IF NEW.payout_at IS NOT NULL AND (NEW.appeal_due_at IS NULL OR (now() < NEW.appeal_due_at AND NEW.appeal_decided_at IS NULL) OR (EXISTS(SELECT 1 FROM public.dispute_appeals WHERE dispute_id=NEW.dispute_id) AND NEW.appeal_decided_at IS NULL)) THEN RAISE EXCEPTION 'Award payout must wait for the appeal period or appeal decision'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_workflow BEFORE INSERT OR UPDATE ON public.case_workflow FOR EACH ROW EXECUTE FUNCTION public.validate_case_workflow();
CREATE OR REPLACE FUNCTION public.validate_case_panel() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE issue_state text; BEGIN
 PERFORM 1 FROM public.disputes WHERE id=NEW.dispute_id FOR UPDATE;
 SELECT state INTO issue_state FROM public.disputes WHERE id=NEW.dispute_id;
 IF NEW.status IN ('Invited','Accepted') THEN
 IF NOT NEW.approved THEN RAISE EXCEPTION 'Panelist must be approved before invitation'; END IF;
 IF issue_state IS NULL THEN RAISE EXCEPTION 'Set the dispute state before inviting panelists'; END IF;
 IF issue_state=ANY(NEW.licensed_states) OR issue_state=ANY(NEW.team_licensed_states) THEN RAISE EXCEPTION 'Panelist or team has a license in the dispute state'; END IF;
 IF (SELECT count(*) FROM public.case_panelists WHERE dispute_id=NEW.dispute_id AND id<>NEW.id AND status IN ('Invited','Accepted'))>=5 THEN RAISE EXCEPTION 'A panel may have no more than five panelists'; END IF;
 IF NEW.challenge_outcome IN ('Pending','Upheld') THEN RAISE EXCEPTION 'Resolve the panelist challenge before invitation or acceptance'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER validate_panel BEFORE INSERT OR UPDATE ON public.case_panelists FOR EACH ROW EXECUTE FUNCTION public.validate_case_panel();
CREATE OR REPLACE FUNCTION public.audit_case_workflow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE record jsonb; case_id uuid; BEGIN
 IF TG_OP='DELETE' THEN record:=to_jsonb(OLD); ELSE record:=to_jsonb(NEW); END IF;
 IF TG_TABLE_NAME='disputes' THEN case_id:=(record->>'id')::uuid; ELSE case_id:=(record->>'dispute_id')::uuid; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.disputes WHERE id=case_id) THEN RETURN NULL; END IF;
 INSERT INTO public.case_audit(dispute_id,actor_id,action,record_type,before_data,after_data) VALUES(case_id,auth.uid(),TG_OP,TG_TABLE_NAME,CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END);
 IF TG_TABLE_NAME<>'disputes' THEN INSERT INTO public.notifications(kind,title,dispute_id,case_number,state) SELECT 'workflow_update','Case workflow updated',id,case_number,state FROM public.disputes WHERE id=case_id; END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER tasks_audit AFTER INSERT OR UPDATE OR DELETE ON public.case_tasks FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER workflow_audit AFTER INSERT OR UPDATE ON public.case_workflow FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER panel_audit AFTER INSERT OR UPDATE OR DELETE ON public.case_panelists FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER communication_audit AFTER INSERT OR UPDATE ON public.case_communications FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER dispute_full_audit AFTER UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER attachment_audit AFTER UPDATE ON public.dispute_attachments FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();
CREATE OR REPLACE FUNCTION public.case_released_decision(_dispute_id uuid) RETURNS TABLE(decision text,released_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT public.can_view_dispute(_dispute_id,auth.uid()) THEN RAISE EXCEPTION 'Case access required'; END IF;
 RETURN QUERY SELECT w.released_decision,w.released_at FROM public.case_workflow w WHERE w.dispute_id=_dispute_id AND w.released_at IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.case_released_decision(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.case_released_decision(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.audit_case_workflow(),public.validate_case_workflow(),public.validate_case_panel() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.audit_case_workflow(),public.validate_case_workflow(),public.validate_case_panel() TO service_role;