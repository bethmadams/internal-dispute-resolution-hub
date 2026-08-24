ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS complainant_email text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS respondent_email text,
  ADD COLUMN IF NOT EXISTS respondent_phone text,
  ADD COLUMN IF NOT EXISTS respondent_active boolean,
  ADD COLUMN IF NOT EXISTS reasons text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ethics_articles text,
  ADD COLUMN IF NOT EXISTS seeking text,
  ADD COLUMN IF NOT EXISTS steps_taken text,
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS closing_date date,
  ADD COLUMN IF NOT EXISTS involves_money boolean,
  ADD COLUMN IF NOT EXISTS monetary_amount numeric,
  ADD COLUMN IF NOT EXISTS additional_comments text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'staff';

CREATE POLICY disputes_insert_public ON public.disputes
  FOR INSERT TO anon
  WITH CHECK (created_by IS NULL AND source = 'public_form' AND stage = 'New Submission'::public.dispute_stage);

GRANT INSERT ON public.disputes TO anon;

CREATE TABLE public.dispute_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE SET NULL,
  responder_name text NOT NULL,
  responder_email text,
  submitted_on date NOT NULL DEFAULT CURRENT_DATE,
  state text,
  responding_to_name text,
  summary text NOT NULL,
  additional_comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.dispute_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispute_responses TO authenticated;
GRANT ALL ON public.dispute_responses TO service_role;

ALTER TABLE public.dispute_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY responses_insert_public ON public.dispute_responses
  FOR INSERT TO anon WITH CHECK (dispute_id IS NULL);
CREATE POLICY responses_select ON public.dispute_responses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY responses_insert_staff ON public.dispute_responses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY responses_update_staff ON public.dispute_responses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY responses_delete_admin ON public.dispute_responses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER dispute_responses_updated_at BEFORE UPDATE ON public.dispute_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dispute_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE CASCADE,
  response_id uuid REFERENCES public.dispute_responses(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'supporting',
  file_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.dispute_attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispute_attachments TO authenticated;
GRANT ALL ON public.dispute_attachments TO service_role;

ALTER TABLE public.dispute_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY attachments_insert_public ON public.dispute_attachments
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY attachments_select ON public.dispute_attachments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY attachments_insert_staff ON public.dispute_attachments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY attachments_delete_admin ON public.dispute_attachments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX dispute_attachments_dispute_idx ON public.dispute_attachments(dispute_id);
CREATE INDEX dispute_attachments_response_idx ON public.dispute_attachments(response_id);