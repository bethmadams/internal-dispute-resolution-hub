CREATE TYPE public.app_role AS ENUM ('admin','investigator','viewer');
CREATE TYPE public.dispute_stage AS ENUM ('New Submission','In Progress','Hearing Scheduled','Appeal Filed','Closed');
CREATE TYPE public.dispute_priority AS ENUM ('Low','Medium','High','Urgent');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'admin'::public.app_role ELSE 'investigator'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  filed_by text,
  respondent text,
  department text,
  stage public.dispute_stage NOT NULL DEFAULT 'New Submission',
  priority public.dispute_priority NOT NULL DEFAULT 'Medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filed_at date NOT NULL DEFAULT current_date,
  hearing_date timestamptz,
  resolution text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_select" ON public.disputes FOR SELECT TO authenticated USING (true);
CREATE POLICY "disputes_insert" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "disputes_update" ON public.disputes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "disputes_delete_admin" ON public.disputes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dispute_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispute_notes TO authenticated;
GRANT ALL ON public.dispute_notes TO service_role;
ALTER TABLE public.dispute_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_select" ON public.dispute_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_insert" ON public.dispute_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "notes_update_own" ON public.dispute_notes FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "notes_delete_own_or_admin" ON public.dispute_notes FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "resources_insert" ON public.resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "resources_update" ON public.resources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "resources_delete_admin" ON public.resources FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.resources (title, description, category, url) VALUES
 ('Internal Dispute Resolution Policy', 'Governing policy document outlining the full IDR process, timelines and responsibilities.', 'Policy', null),
 ('Dispute Intake Form Template', 'Standard form completed by the filing party at intake.', 'Template', null),
 ('Hearing Panel Guidelines', 'How hearing panels are composed, run, and documented.', 'Guideline', null),
 ('Appeal Process Overview', 'Steps, deadlines, and required documentation for filing an appeal.', 'Guideline', null),
 ('Case Closure Checklist', 'Required steps before a dispute can be marked closed.', 'Checklist', null);