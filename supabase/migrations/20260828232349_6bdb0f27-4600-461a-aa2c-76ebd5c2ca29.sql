CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  state text,
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE CASCADE,
  case_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);

CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own read marks" ON public.notification_reads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_dispute_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (kind, title, body, state, dispute_id, case_number)
  VALUES ('hearing_request',
          'New hearing request submitted',
          COALESCE(NEW.title, 'New dispute') || COALESCE(' — filed by ' || NEW.filed_by, ''),
          NEW.state, NEW.id, NEW.case_number);
  RETURN NEW;
END; $$;

CREATE TRIGGER disputes_notify_insert
AFTER INSERT ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.notify_dispute_insert();

CREATE OR REPLACE FUNCTION public.notify_dispute_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE changes text[] := '{}';
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN changes := changes || ('stage → ' || NEW.stage::text); END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN changes := changes || ('priority → ' || NEW.priority::text); END IF;
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN changes := changes || 'assignment updated'; END IF;
  IF NEW.hearing_date IS DISTINCT FROM OLD.hearing_date THEN changes := changes || 'hearing date updated'; END IF;
  IF NEW.resolution IS DISTINCT FROM OLD.resolution THEN changes := changes || 'resolution updated'; END IF;
  IF array_length(changes, 1) IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (kind, title, body, state, dispute_id, case_number)
  VALUES ('case_update',
          'Case updated: ' || COALESCE(NEW.case_number, ''),
          array_to_string(changes, ', '),
          NEW.state, NEW.id, NEW.case_number);
  RETURN NEW;
END; $$;

CREATE TRIGGER disputes_notify_update
AFTER UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.notify_dispute_update();

CREATE OR REPLACE FUNCTION public.notify_response_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnum text;
BEGIN
  SELECT case_number INTO cnum FROM public.disputes WHERE id = NEW.dispute_id;
  INSERT INTO public.notifications (kind, title, body, state, dispute_id, case_number)
  VALUES ('response',
          'New hearing response submitted',
          NEW.responder_name || COALESCE(' — responding to ' || NEW.responding_to_name, ''),
          NEW.state, NEW.dispute_id, cnum);
  RETURN NEW;
END; $$;

CREATE TRIGGER dispute_responses_notify_insert
AFTER INSERT ON public.dispute_responses
FOR EACH ROW EXECUTE FUNCTION public.notify_response_insert();

CREATE OR REPLACE FUNCTION public.notify_appeal_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnum text;
BEGIN
  SELECT case_number INTO cnum FROM public.disputes WHERE id = NEW.dispute_id;
  INSERT INTO public.notifications (kind, title, body, state, dispute_id, case_number)
  VALUES ('appeal',
          'New appeal request submitted',
          NEW.appellant_name || ' (' || NEW.appellant_role || ')',
          NEW.state, NEW.dispute_id, cnum);
  RETURN NEW;
END; $$;

CREATE TRIGGER dispute_appeals_notify_insert
AFTER INSERT ON public.dispute_appeals
FOR EACH ROW EXECUTE FUNCTION public.notify_appeal_insert();

CREATE OR REPLACE FUNCTION public.notify_note_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnum text; st text;
BEGIN
  SELECT case_number, state INTO cnum, st FROM public.disputes WHERE id = NEW.dispute_id;
  INSERT INTO public.notifications (kind, title, body, state, dispute_id, case_number)
  VALUES ('note',
          'New case note on ' || COALESCE(cnum, 'a case'),
          left(NEW.body, 160),
          st, NEW.dispute_id, cnum);
  RETURN NEW;
END; $$;

CREATE TRIGGER dispute_notes_notify_insert
AFTER INSERT ON public.dispute_notes
FOR EACH ROW EXECUTE FUNCTION public.notify_note_insert();