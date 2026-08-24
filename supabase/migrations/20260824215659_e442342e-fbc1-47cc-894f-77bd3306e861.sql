CREATE TABLE public.dispute_appeals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE SET NULL,
  appellant_name text NOT NULL,
  appellant_role text NOT NULL,
  appellant_email text NOT NULL,
  state text,
  hearing_date date,
  new_evidence text NOT NULL,
  submitted_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispute_appeals TO authenticated;
GRANT INSERT ON public.dispute_appeals TO anon;
GRANT ALL ON public.dispute_appeals TO service_role;

ALTER TABLE public.dispute_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appeals_insert_public" ON public.dispute_appeals FOR INSERT TO anon WITH CHECK (dispute_id IS NULL);
CREATE POLICY "appeals_insert_staff" ON public.dispute_appeals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appeals_select" ON public.dispute_appeals FOR SELECT TO authenticated USING (true);
CREATE POLICY "appeals_update_staff" ON public.dispute_appeals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "appeals_delete_admin" ON public.dispute_appeals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER dispute_appeals_updated_at BEFORE UPDATE ON public.dispute_appeals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.dispute_attachments
  ADD COLUMN appeal_id uuid REFERENCES public.dispute_appeals(id) ON DELETE CASCADE;