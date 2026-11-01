CREATE OR REPLACE FUNCTION public.match_response_to_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE matches uuid[];
BEGIN
  IF NEW.dispute_id IS NOT NULL THEN RETURN NULL; END IF;
  SELECT array_agg(d.id) INTO matches FROM public.disputes d
  WHERE d.stage <> 'Closed'
    AND lower(public.person_last_name(d.respondent)) = lower(public.person_last_name(NEW.responder_name))
    AND lower(public.person_last_name(d.filed_by)) = lower(public.person_last_name(NEW.responding_to_name));
  IF cardinality(matches) = 1 THEN
    UPDATE public.dispute_responses SET dispute_id = matches[1] WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION public.match_case_to_responses()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'Closed' THEN RETURN NULL; END IF;
  UPDATE public.dispute_responses r SET dispute_id = NEW.id
  WHERE r.dispute_id IS NULL
    AND lower(public.person_last_name(r.responder_name)) = lower(public.person_last_name(NEW.respondent))
    AND lower(public.person_last_name(r.responding_to_name)) = lower(public.person_last_name(NEW.filed_by))
    AND (SELECT count(*) FROM public.disputes d WHERE d.stage <> 'Closed'
      AND lower(public.person_last_name(d.respondent)) = lower(public.person_last_name(r.responder_name))
      AND lower(public.person_last_name(d.filed_by)) = lower(public.person_last_name(r.responding_to_name))) = 1;
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION public.link_attachment_to_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.response_id IS NOT NULL THEN
    SELECT dispute_id INTO NEW.dispute_id FROM public.dispute_responses WHERE id = NEW.response_id;
  ELSIF NEW.appeal_id IS NOT NULL THEN
    SELECT dispute_id INTO NEW.dispute_id FROM public.dispute_appeals WHERE id = NEW.appeal_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER attachment_case_link BEFORE INSERT ON public.dispute_attachments FOR EACH ROW EXECUTE FUNCTION public.link_attachment_to_case();
CREATE OR REPLACE FUNCTION public.sync_submission_attachments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'dispute_responses' THEN
    UPDATE public.dispute_attachments SET dispute_id = NEW.dispute_id WHERE response_id = NEW.id;
  ELSE
    UPDATE public.dispute_attachments SET dispute_id = NEW.dispute_id WHERE appeal_id = NEW.id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER response_attachment_case_sync AFTER UPDATE OF dispute_id ON public.dispute_responses FOR EACH ROW EXECUTE FUNCTION public.sync_submission_attachments();
CREATE TRIGGER appeal_attachment_case_sync AFTER UPDATE OF dispute_id ON public.dispute_appeals FOR EACH ROW EXECUTE FUNCTION public.sync_submission_attachments();
CREATE TRIGGER case_title_party_update BEFORE UPDATE OF filed_by, respondent ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_case_title();
REVOKE ALL ON FUNCTION public.link_attachment_to_case(), public.sync_submission_attachments(), public.match_response_to_case(), public.match_case_to_responses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_attachment_to_case(), public.sync_submission_attachments(), public.match_response_to_case(), public.match_case_to_responses() TO service_role;
ALTER POLICY dispute_files_staff_read ON storage.objects TO authenticated USING (
  bucket_id = 'dispute-files' AND (
    public.is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.dispute_attachments a
      WHERE a.file_path = storage.objects.name AND public.can_view_dispute(a.dispute_id, auth.uid())
    )
  )
);