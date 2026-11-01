CREATE TABLE public.case_checklist_forms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 stage public.dispute_stage NOT NULL, answers jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1,
 updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(dispute_id,stage), CHECK(jsonb_typeof(answers)='object')
);
GRANT SELECT ON public.case_checklist_forms TO authenticated;
GRANT ALL ON public.case_checklist_forms TO service_role;
ALTER TABLE public.case_checklist_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklist_staff_read ON public.case_checklist_forms FOR SELECT TO authenticated USING(public.is_staff(auth.uid()) AND public.can_view_dispute(dispute_id,auth.uid()));
CREATE OR REPLACE FUNCTION public.save_stage_checklist(_case_id uuid,_stage public.dispute_stage,_answers jsonb,_version integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved_version integer; entry jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) OR NOT public.can_view_dispute(_case_id,auth.uid()) THEN RAISE EXCEPTION 'Staff case access required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(_answers) IS DISTINCT FROM 'object' OR octet_length(_answers::text)>200000 THEN RAISE EXCEPTION 'Invalid checklist answers'; END IF;
 FOR entry IN SELECT value FROM jsonb_each(_answers) LOOP
 IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR COALESCE(entry->>'status','') NOT IN ('pending','yes','no','na') OR length(COALESCE(entry->>'notes',''))>6000 THEN RAISE EXCEPTION 'Invalid checklist response'; END IF;
 END LOOP;
 PERFORM 1 FROM public.disputes WHERE id=_case_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
 INSERT INTO public.case_checklist_forms(dispute_id,stage,answers,updated_by) SELECT _case_id,_stage,_answers,auth.uid() WHERE _version=0
 ON CONFLICT(dispute_id,stage) DO NOTHING RETURNING version INTO saved_version;
 IF saved_version IS NULL THEN
 UPDATE public.case_checklist_forms SET answers=_answers,version=version+1,updated_by=auth.uid(),updated_at=now() WHERE dispute_id=_case_id AND stage=_stage AND version=_version RETURNING version INTO saved_version;
 END IF;
 IF saved_version IS NULL THEN RAISE EXCEPTION 'Checklist changed. Reload saved answers before saving.'; END IF;
 RETURN saved_version;
END $$;
REVOKE ALL ON FUNCTION public.save_stage_checklist(uuid,public.dispute_stage,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_stage_checklist(uuid,public.dispute_stage,jsonb,integer) TO authenticated;
CREATE TRIGGER stage_form_audit AFTER INSERT OR UPDATE ON public.case_checklist_forms FOR EACH ROW EXECUTE FUNCTION public.audit_case_workflow();