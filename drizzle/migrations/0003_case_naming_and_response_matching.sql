CREATE OR REPLACE FUNCTION public.person_last_name(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT NULLIF(regexp_replace(btrim(coalesce(_name, '')), '^.*\s+', ''), '')
$$;

CREATE OR REPLACE FUNCTION public.set_case_title()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.person_last_name(NEW.filed_by) IS NOT NULL AND public.person_last_name(NEW.respondent) IS NOT NULL THEN
    NEW.title := public.person_last_name(NEW.filed_by) || ' v. ' || public.person_last_name(NEW.respondent);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_case_title() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS set_case_title ON public.disputes;
CREATE TRIGGER set_case_title BEFORE INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_case_title();

CREATE OR REPLACE FUNCTION public.match_response_to_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _match uuid;
BEGIN
  IF NEW.dispute_id IS NOT NULL THEN RETURN NULL; END IF;
  SELECT d.id INTO _match FROM public.disputes d
  WHERE d.stage <> 'Closed'
    AND lower(public.person_last_name(d.respondent)) = lower(public.person_last_name(NEW.responder_name))
    AND lower(public.person_last_name(d.filed_by)) = lower(public.person_last_name(NEW.responding_to_name))
  ORDER BY d.created_at DESC LIMIT 1;
  IF _match IS NOT NULL THEN
    UPDATE public.dispute_responses SET dispute_id = _match WHERE id = NEW.id;
    UPDATE public.dispute_attachments SET dispute_id = _match WHERE response_id = NEW.id AND dispute_id IS NULL;
  END IF;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.match_response_to_case() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS match_response_to_case ON public.dispute_responses;
CREATE TRIGGER match_response_to_case AFTER INSERT ON public.dispute_responses
  FOR EACH ROW EXECUTE FUNCTION public.match_response_to_case();

CREATE OR REPLACE FUNCTION public.match_case_to_responses()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  WITH linked AS (
    UPDATE public.dispute_responses r SET dispute_id = NEW.id
    WHERE r.dispute_id IS NULL
      AND lower(public.person_last_name(r.responder_name)) = lower(public.person_last_name(NEW.respondent))
      AND lower(public.person_last_name(r.responding_to_name)) = lower(public.person_last_name(NEW.filed_by))
    RETURNING r.id)
  UPDATE public.dispute_attachments a SET dispute_id = NEW.id
  WHERE a.dispute_id IS NULL AND a.response_id IN (SELECT id FROM linked);
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.match_case_to_responses() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS match_case_to_responses ON public.disputes;
CREATE TRIGGER match_case_to_responses AFTER INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.match_case_to_responses();

UPDATE public.disputes SET title = public.person_last_name(filed_by) || ' v. ' || public.person_last_name(respondent)
WHERE source = 'public_form' AND public.person_last_name(filed_by) IS NOT NULL AND public.person_last_name(respondent) IS NOT NULL;

UPDATE public.dispute_responses r SET dispute_id = (
  SELECT d.id FROM public.disputes d
  WHERE d.stage <> 'Closed'
    AND lower(public.person_last_name(d.respondent)) = lower(public.person_last_name(r.responder_name))
    AND lower(public.person_last_name(d.filed_by)) = lower(public.person_last_name(r.responding_to_name))
  ORDER BY d.created_at DESC LIMIT 1)
WHERE r.dispute_id IS NULL;

UPDATE public.dispute_attachments a SET dispute_id = r.dispute_id
FROM public.dispute_responses r
WHERE a.response_id = r.id AND a.dispute_id IS NULL AND r.dispute_id IS NOT NULL;