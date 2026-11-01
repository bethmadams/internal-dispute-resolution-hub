CREATE OR REPLACE FUNCTION public.edit_submitted_form(_kind text, _id uuid, _expected_updated_at timestamptz, _values jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE d public.disputes; r public.dispute_responses; a public.dispute_appeals; allowed text[]; changed integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only administrators can edit submitted forms' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(_values) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid form values'; END IF;
 IF _kind='hearing_request' THEN
 allowed:=ARRAY['filed_by','complainant_email','respondent','respondent_email','respondent_phone','respondent_active','state','department','filed_at','description','reasons','ethics_articles','seeking','steps_taken','property_address','closing_date','involves_money','monetary_amount','additional_comments','mb_dmb_name','mb_dmb_email'];
 ELSIF _kind='response' THEN
 allowed:=ARRAY['responder_name','responder_email','submitted_on','state','responding_to_name','summary','additional_comments','mb_dmb_name','mb_dmb_email'];
 ELSIF _kind='appeal' THEN
 allowed:=ARRAY['appellant_name','appellant_email','appellant_role','submitted_on','state','hearing_date','new_evidence','mb_dmb_name','mb_dmb_email'];
 ELSE RAISE EXCEPTION 'Unknown form type'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(_values) AS k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'Only submission fields can be edited'; END IF;
 IF _kind='hearing_request' THEN
 SELECT * INTO d FROM public.disputes WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR d.updated_at IS DISTINCT FROM _expected_updated_at THEN RAISE EXCEPTION 'This form changed. Close and reopen the editor before saving.'; END IF;
 d:=jsonb_populate_record(d,_values);
 UPDATE public.disputes SET filed_by=d.filed_by,complainant_email=d.complainant_email,respondent=d.respondent,respondent_email=d.respondent_email,respondent_phone=d.respondent_phone,respondent_active=d.respondent_active,state=d.state,department=d.department,filed_at=d.filed_at,description=d.description,reasons=d.reasons,ethics_articles=d.ethics_articles,seeking=d.seeking,steps_taken=d.steps_taken,property_address=d.property_address,closing_date=d.closing_date,involves_money=d.involves_money,monetary_amount=d.monetary_amount,additional_comments=d.additional_comments,mb_dmb_name=d.mb_dmb_name,mb_dmb_email=d.mb_dmb_email WHERE id=_id;
 ELSIF _kind='response' THEN
 SELECT * INTO r FROM public.dispute_responses WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR r.updated_at IS DISTINCT FROM _expected_updated_at THEN RAISE EXCEPTION 'This form changed. Close and reopen the editor before saving.'; END IF;
 r:=jsonb_populate_record(r,_values);
 UPDATE public.dispute_responses SET responder_name=r.responder_name,responder_email=r.responder_email,submitted_on=r.submitted_on,state=r.state,responding_to_name=r.responding_to_name,summary=r.summary,additional_comments=r.additional_comments,mb_dmb_name=r.mb_dmb_name,mb_dmb_email=r.mb_dmb_email WHERE id=_id;
 ELSE
 SELECT * INTO a FROM public.dispute_appeals WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR a.updated_at IS DISTINCT FROM _expected_updated_at THEN RAISE EXCEPTION 'This form changed. Close and reopen the editor before saving.'; END IF;
 a:=jsonb_populate_record(a,_values);
 UPDATE public.dispute_appeals SET appellant_name=a.appellant_name,appellant_email=a.appellant_email,appellant_role=a.appellant_role,submitted_on=a.submitted_on,state=a.state,hearing_date=a.hearing_date,new_evidence=a.new_evidence,mb_dmb_name=a.mb_dmb_name,mb_dmb_email=a.mb_dmb_email WHERE id=_id;
 END IF;
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'Form could not be saved'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.edit_submitted_form(text,uuid,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_submitted_form(text,uuid,timestamptz,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_submission_content_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE fields text[]; k text;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='disputes' THEN fields:=ARRAY['filed_by','complainant_email','respondent','respondent_email','respondent_phone','respondent_active','state','department','filed_at','description','reasons','ethics_articles','seeking','steps_taken','property_address','closing_date','involves_money','monetary_amount','additional_comments','mb_dmb_name','mb_dmb_email'];
 ELSIF TG_TABLE_NAME='dispute_responses' THEN fields:=ARRAY['responder_name','responder_email','submitted_on','state','responding_to_name','summary','additional_comments','mb_dmb_name','mb_dmb_email'];
 ELSE fields:=ARRAY['appellant_name','appellant_email','appellant_role','submitted_on','state','hearing_date','new_evidence','mb_dmb_name','mb_dmb_email']; END IF;
 FOREACH k IN ARRAY fields LOOP
 IF (to_jsonb(NEW)->k) IS DISTINCT FROM (to_jsonb(OLD)->k) THEN RAISE EXCEPTION 'Only administrators can edit submitted form information' USING ERRCODE='42501'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_dispute_submission_edit BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.guard_submission_content_edit();
CREATE TRIGGER guard_response_submission_edit BEFORE UPDATE ON public.dispute_responses FOR EACH ROW EXECUTE FUNCTION public.guard_submission_content_edit();
CREATE TRIGGER guard_appeal_submission_edit BEFORE UPDATE ON public.dispute_appeals FOR EACH ROW EXECUTE FUNCTION public.guard_submission_content_edit();
CREATE TRIGGER response_content_audit AFTER UPDATE ON public.dispute_responses FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.audit_case_workflow();
CREATE TRIGGER appeal_content_audit AFTER UPDATE ON public.dispute_appeals FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.audit_case_workflow();