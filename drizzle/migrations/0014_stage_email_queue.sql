CREATE TABLE public.stage_email_queue (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE, stage public.dispute_stage NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, gmail_id text, error text, UNIQUE(dispute_id,stage));
GRANT SELECT ON public.stage_email_queue TO authenticated;
GRANT ALL ON public.stage_email_queue TO service_role;
ALTER TABLE public.stage_email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY stage_email_staff_read ON public.stage_email_queue FOR SELECT TO authenticated USING(public.is_staff(auth.uid()));
CREATE FUNCTION public.queue_stage_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN
 IF NEW.source<>'public_form' OR NEW.stage::text<>'New Submission' THEN RETURN NEW; END IF;
 ELSE
 IF NEW.stage IS NOT DISTINCT FROM OLD.stage THEN RETURN NEW; END IF;
 END IF;
 IF NEW.stage::text IN ('New Submission','In Progress','Awaiting Response') THEN
 INSERT INTO public.stage_email_queue(dispute_id,stage) VALUES(NEW.id,NEW.stage) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
 END $$;
REVOKE ALL ON FUNCTION public.queue_stage_email() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_stage_email() TO service_role;
CREATE TRIGGER stage_email_enqueue AFTER INSERT OR UPDATE OF stage ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.queue_stage_email();
CREATE FUNCTION public.record_stage_email_sent(_queue_id uuid,_gmail_id text,_sent_at timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE item public.stage_email_queue; BEGIN
 SELECT * INTO item FROM public.stage_email_queue WHERE id=_queue_id AND status='sending' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Delivery claim not found'; END IF;
 UPDATE public.stage_email_queue SET status='sent',sent_at=_sent_at,gmail_id=_gmail_id,error=NULL WHERE id=_queue_id;
 IF item.stage::text='Awaiting Response' THEN
 INSERT INTO public.case_tasks(dispute_id,template_key,phase,title,assignee_id,due_at,evidence_note)
 SELECT id,'response','Pre-hearing','Receive respondent defense paperwork',assigned_to,_sent_at+interval '240 hours','Respondent invitation accepted by Gmail: '||_sent_at::text FROM public.disputes WHERE id=item.dispute_id
 ON CONFLICT(dispute_id,template_key) DO UPDATE SET due_at=EXCLUDED.due_at,evidence_note=concat_ws(E'\n',nullif(case_tasks.evidence_note,''),EXCLUDED.evidence_note) WHERE case_tasks.due_at IS NULL AND case_tasks.completed_at IS NULL;
 UPDATE public.case_tasks SET completed_at=_sent_at,evidence_note=concat_ws(E'\n',nullif(evidence_note,''),'Respondent invitation accepted by Gmail') WHERE dispute_id=item.dispute_id AND template_key='respondent_invite' AND completed_at IS NULL;
 END IF;
 END $$;
REVOKE ALL ON FUNCTION public.record_stage_email_sent(uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_stage_email_sent(uuid,text,timestamptz) TO service_role;