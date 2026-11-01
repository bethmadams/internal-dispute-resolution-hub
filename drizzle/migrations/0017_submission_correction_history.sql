CREATE TABLE public.submission_corrections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), form_type text NOT NULL, submission_id uuid NOT NULL, dispute_id uuid, actor_id uuid NOT NULL, before_data jsonb NOT NULL, after_data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.submission_corrections TO authenticated;
GRANT ALL ON public.submission_corrections TO service_role;
ALTER TABLE public.submission_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY submission_corrections_admin_read ON public.submission_corrections FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.record_submission_correction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin') THEN
 INSERT INTO public.submission_corrections(form_type,submission_id,dispute_id,actor_id,before_data,after_data)
 VALUES(CASE TG_TABLE_NAME WHEN 'disputes' THEN 'hearing_request' WHEN 'dispute_responses' THEN 'response' ELSE 'appeal' END,NEW.id,CASE WHEN TG_TABLE_NAME='disputes' THEN NEW.id ELSE (to_jsonb(NEW)->>'dispute_id')::uuid END,auth.uid(),to_jsonb(OLD),to_jsonb(NEW));
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER request_correction_history AFTER UPDATE ON public.disputes FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.record_submission_correction();
CREATE TRIGGER response_correction_history AFTER UPDATE ON public.dispute_responses FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.record_submission_correction();
CREATE TRIGGER appeal_correction_history AFTER UPDATE ON public.dispute_appeals FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) EXECUTE FUNCTION public.record_submission_correction();