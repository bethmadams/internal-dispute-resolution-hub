CREATE OR REPLACE FUNCTION public.enforce_invite_only_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.team_invites WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL)
     OR EXISTS (SELECT 1 FROM public.case_access WHERE user_id IS NULL AND lower(invite_email) = lower(NEW.email)) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'INVITE_REQUIRED: This email has not been invited to the hub.';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_invite_only_signup() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_invite_only_signup ON auth.users;
CREATE TRIGGER enforce_invite_only_signup BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.enforce_invite_only_signup();