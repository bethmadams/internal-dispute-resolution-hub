ALTER TABLE public.case_access
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS invite_email text,
  ADD COLUMN IF NOT EXISTS invite_name text,
  ADD COLUMN IF NOT EXISTS states text[] NOT NULL DEFAULT '{}'::text[];

CREATE UNIQUE INDEX IF NOT EXISTS case_access_dispute_email_idx
  ON public.case_access (dispute_id, lower(invite_email))
  WHERE invite_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invited_role public.app_role;
  has_case_invite boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT role INTO invited_role
  FROM public.team_invites
  WHERE lower(email) = lower(NEW.email)
    AND accepted_at IS NULL
  LIMIT 1;

  IF invited_role IS NOT NULL THEN
    UPDATE public.team_invites
      SET accepted_at = now()
      WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL;
  END IF;

  UPDATE public.case_access
    SET user_id = NEW.id
    WHERE user_id IS NULL AND lower(invite_email) = lower(NEW.email);

  SELECT EXISTS (
    SELECT 1 FROM public.case_access
    WHERE user_id = NEW.id AND invite_email IS NOT NULL
  ) INTO has_case_invite;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      invited_role,
      CASE
        WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'admin'::public.app_role
        WHEN has_case_invite THEN 'viewer'::public.app_role
        ELSE 'investigator'::public.app_role
      END
    )
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_dispute(_dispute_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.is_staff(_user_id)
    OR (_dispute_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.case_access ca
      WHERE ca.dispute_id = _dispute_id
        AND ca.user_id = _user_id
        AND (ca.expires_at IS NULL OR ca.expires_at > now())
    ))
$function$;