CREATE OR REPLACE FUNCTION public.queue_submission_copy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'disputes' THEN
    IF NEW.source <> 'public_form' THEN RETURN NEW; END IF;
  END IF;
  INSERT INTO public.submission_copy_queue (id, form_type, payload) VALUES (NEW.id, TG_ARGV[0], to_jsonb(NEW));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.queue_submission_copy() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_submission_copy() TO service_role;