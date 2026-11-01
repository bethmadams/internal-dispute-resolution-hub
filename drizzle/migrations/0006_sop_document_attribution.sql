CREATE OR REPLACE FUNCTION public.attribute_case_document() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.response_id IS NOT NULL THEN SELECT responder_name,'Respondent' INTO NEW.submitted_by_name,NEW.submitted_as FROM public.dispute_responses WHERE id=NEW.response_id;
 ELSIF NEW.appeal_id IS NOT NULL THEN SELECT appellant_name,'Appellant' INTO NEW.submitted_by_name,NEW.submitted_as FROM public.dispute_appeals WHERE id=NEW.appeal_id;
 ELSIF NEW.dispute_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.disputes WHERE id=NEW.dispute_id AND source='public_form') AND auth.uid() IS NULL THEN SELECT filed_by,'Complainant' INTO NEW.submitted_by_name,NEW.submitted_as FROM public.disputes WHERE id=NEW.dispute_id;
 ELSIF auth.uid() IS NOT NULL THEN SELECT COALESCE(full_name,email),'Staff' INTO NEW.submitted_by_name,NEW.submitted_as FROM public.profiles WHERE id=auth.uid(); END IF;
 NEW.submitted_by_name:=COALESCE(NEW.submitted_by_name,''); NEW.submitted_as:=COALESCE(NEW.submitted_as,'');
 IF NEW.kind='panel_decision' THEN NEW.visibility:='staff'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attribute_document BEFORE INSERT ON public.dispute_attachments FOR EACH ROW EXECUTE FUNCTION public.attribute_case_document();
REVOKE ALL ON FUNCTION public.attribute_case_document() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.attribute_case_document() TO service_role;