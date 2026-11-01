CREATE OR REPLACE FUNCTION public.audit_case_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE record jsonb; case_id uuid; BEGIN
 IF TG_OP='DELETE' THEN record:=to_jsonb(OLD); ELSE record:=to_jsonb(NEW); END IF;
 IF TG_TABLE_NAME='disputes' THEN case_id:=(record->>'id')::uuid; ELSE case_id:=(record->>'dispute_id')::uuid; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.disputes WHERE id=case_id) THEN RETURN NULL; END IF;
 INSERT INTO public.case_audit(dispute_id,actor_id,action,record_type,before_data,after_data) VALUES(case_id,auth.uid(),TG_OP,TG_TABLE_NAME,CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END,CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END);
 IF TG_TABLE_NAME<>'disputes' AND NOT (TG_TABLE_NAME='case_tasks' AND TG_OP='INSERT' AND pg_trigger_depth()>1) THEN INSERT INTO public.notifications(kind,title,dispute_id,case_number,state) SELECT 'workflow_update','Case workflow updated',id,case_number,state FROM public.disputes WHERE id=case_id; END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION public.initialize_stage_checklist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE phase_name text;
BEGIN
 IF NEW.stage IS NOT DISTINCT FROM OLD.stage THEN RETURN NEW; END IF;
 phase_name:=CASE NEW.stage::text WHEN 'In Progress' THEN 'Pre-hearing' WHEN 'Hearing Scheduled' THEN 'Hearing' WHEN 'Appeal Filed' THEN 'Appeal' END;
 IF phase_name IS NULL THEN RETURN NEW; END IF;
 INSERT INTO public.case_tasks(dispute_id,template_key,phase,title,assignee_id)
 SELECT NEW.id,t.key,t.phase,t.title,NEW.assigned_to FROM (VALUES
('mediation','Pre-hearing','Attempt broker mediation'),
('response','Pre-hearing','Receive respondent defense paperwork'),
('witness','Pre-hearing','Receive witness statements through Regulatory Relations'),
('schedule','Pre-hearing','Confirm hearing date with parties and panel'),
('notice','Pre-hearing','Notify participants of confirmed hearing'),
('review','Post-hearing','Obtain director and broker decision acknowledgment'),
('filing','Post-hearing','File decision email in Enterprise and Hubspot'),
('repayment','Post-hearing','Receive repayment of already-disbursed funds'),
('appeal','Appeal','Close appeal submission window'),
('ce','Post-hearing','Receive live continuing education certificate'),
('mediation_records','Pre-hearing','Record unsuccessful mediation, Enterprise and Hubspot notes'),
('regional_review','Pre-hearing','Confirm Regional Director consultation and voluntary participation'),
('agreements','Pre-hearing','Verify both signed binding agreements and complete evidence'),
('panel','Pre-hearing','Select approved panel, check state conflicts and resolve party challenges'),
('hub_chat','Pre-hearing','Create Hub chat with panelists and MB/DMB'),
('calendar','Pre-hearing','Send calendar invitations with room and location details'),
('chair','Hearing','Confirm hearing chair and chairperson script'),
('room','Hearing','Prepare eXp.world room, phone access and cameras'),
('presentations','Hearing','Hear parties and clarifying questions; record requested broker attendance'),
('award','Hearing','Complete Hearing Award and Final Disposition'),
('release','Post-hearing','Send reviewed decision to parties, copying broker and director'),
('payout','Post-hearing','Confirm appeal resolution or expiry before award payout'),
('followup','Post-hearing','Record broker-supervised compliance and follow-up'),
('new_evidence','Appeal','Review genuinely new appeal information and prior unavailability'),
('original_panel','Appeal','Refer appeal to original hearing panel'),
('appeal_response','Appeal','Record whether panel requests the other party’s written response'),
('appeal_decision','Appeal','Record panel appeal decision and communicate outcome'),
('active_check','Pre-hearing','Verify respondent active and not suspended in Enterprise'),
('respondent_invite','Pre-hearing','Send respondent invitation from Regulatory Relations, copying MB/DMB'),
('panel_invite','Pre-hearing','Send proposed panelist invitations and record response deadlines'),
('panel_availability','Pre-hearing','Confirm panel availability and seating acceptance'),
('party_folders','Pre-hearing','Organize separate complainant and respondent document sets'),
('no_response','Pre-hearing','Review missing respondent response and notify complainant and MB/DMB'),
('mb_documents','Pre-hearing','Notify MB/DMB that both parties’ documents were received'),
('nda','Pre-hearing','Verify required panelist confidentiality agreements'),
('challenge_notice','Pre-hearing','Send panel list and Notice of Right to Challenge to both parties'),
('no_recording','Hearing','Confirm hearing is not recorded'),
('facts','Hearing','Review Finding of Facts Worksheet and Factors for Consideration'),
('complainant_time','Hearing','Complainant presentation — 30 minutes'),
('respondent_time','Hearing','Respondent presentation — 30 minutes'),
('qa_time','Hearing','Panel questions — 20 minutes'),
('closing','Hearing','Chair reads closing statement'),
('signatures','Post-hearing','Record findings, rationale and recommendations; obtain panel signatures'),
('agent_calls','Post-hearing','MB/DMB discusses decision separately with each agent'),
('icon','Post-hearing','Notify ICON award team for eligible panelists'),
('chat_archive','Post-hearing','Archive Hub chat record after appeal period or appeal decision'),
('appeal_notify','Appeal','Notify MB/DMB and original chair of appeal receipt'),
('appeal_parties','Appeal','Notify appellant and, if requested by panel, non-appellant with new evidence'),
('appeal_hearing','Appeal','If panel requests a hearing, confirm date, script and appeal procedures'),
('appellant_time','Appeal','If appeal hearing is held: appellant presentation — 20 minutes'),
('appeal_respondent_time','Appeal','If appeal hearing is held: respondent presentation — 20 minutes'),
('appeal_qa_time','Appeal','If appeal hearing is held: panel questions — 15 minutes')
 ) AS t(key,phase,title) WHERE t.phase=phase_name
 ON CONFLICT(dispute_id,template_key) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.initialize_stage_checklist() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_stage_checklist() TO service_role;
CREATE TRIGGER stage_checklist_init AFTER UPDATE OF stage ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.initialize_stage_checklist();
CREATE OR REPLACE FUNCTION public.transition_case_stage(_case_id uuid,_expected_stage public.dispute_stage,_stage public.dispute_stage,_response_sent_at timestamptz DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE matter public.disputes;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
 SELECT * INTO matter FROM public.disputes WHERE id=_case_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
 IF matter.stage<>_expected_stage THEN RAISE EXCEPTION 'Stage changed; refresh the case before continuing'; END IF;
 IF _response_sent_at IS NOT NULL AND (matter.stage<>'New Submission' OR _stage<>'In Progress') THEN RAISE EXCEPTION 'Response clock applies only when starting pre-hearing'; END IF;
 IF _response_sent_at>now() THEN RAISE EXCEPTION 'Invitation sent date cannot be in the future'; END IF;
 UPDATE public.disputes SET stage=_stage WHERE id=_case_id;
 IF _response_sent_at IS NOT NULL THEN
 UPDATE public.case_tasks SET due_at=_response_sent_at+interval '240 hours', evidence_note=concat_ws(E'\n',nullif(evidence_note,''),'Staff-confirmed respondent invitation sent: '||_response_sent_at::text) WHERE dispute_id=_case_id AND template_key='response' AND due_at IS NULL AND completed_at IS NULL;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.transition_case_stage(uuid,public.dispute_stage,public.dispute_stage,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_case_stage(uuid,public.dispute_stage,public.dispute_stage,timestamptz) TO authenticated,service_role;