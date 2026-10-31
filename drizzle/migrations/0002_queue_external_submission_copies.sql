CREATE TABLE public.submission_copy_queue (
 id uuid PRIMARY KEY,
 form_type text NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 copied_at timestamptz,
 CONSTRAINT submission_copy_type CHECK (form_type IN ('hearing_request','hearing_response','appeal'))
);
GRANT ALL ON public.submission_copy_queue TO service_role;
ALTER TABLE public.submission_copy_queue ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.queue_submission_copy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_TABLE_NAME = 'disputes' AND NEW.source <> 'public_form' THEN RETURN NEW; END IF;
 INSERT INTO public.submission_copy_queue (id, form_type, payload) VALUES (NEW.id, TG_ARGV[0], to_jsonb(NEW));
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_submission_copy() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER queue_hearing_request_copy AFTER INSERT ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.queue_submission_copy('hearing_request');
CREATE TRIGGER queue_hearing_response_copy AFTER INSERT ON public.dispute_responses FOR EACH ROW EXECUTE FUNCTION public.queue_submission_copy('hearing_response');
CREATE TRIGGER queue_appeal_copy AFTER INSERT ON public.dispute_appeals FOR EACH ROW EXECUTE FUNCTION public.queue_submission_copy('appeal');