-- New participant roles for role assignment and case access (functions to be defined later)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'complainant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'respondent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'panel_member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'panel_chair';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';

-- Role carried on a per-case access grant
ALTER TABLE public.case_access ADD COLUMN case_role text NOT NULL DEFAULT 'viewer';
ALTER TABLE public.case_access ADD CONSTRAINT case_access_case_role_check
  CHECK (case_role IN ('viewer','complainant','respondent','panel_member','panel_chair','broker','director'));
COMMENT ON COLUMN public.case_access.case_role IS 'Participant role for this case grant (viewer until role functions are defined)';