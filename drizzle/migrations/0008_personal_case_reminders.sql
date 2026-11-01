CREATE TABLE public.personal_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 user_email text NOT NULL DEFAULT '',
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 created_by_email text NOT NULL DEFAULT '',
 body text NOT NULL CHECK (length(btrim(body)) > 0),
 due_at timestamptz NOT NULL,
 lead_minutes integer NOT NULL DEFAULT 0 CHECK (lead_minutes IN (0,5,10,15,30,60,120,1440,2880,10080,43200)),
 remind_at timestamptz NOT NULL,
 done boolean NOT NULL DEFAULT false,
 notified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.personal_reminders TO authenticated;
GRANT ALL ON public.personal_reminders TO service_role;
ALTER TABLE public.personal_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_case_read ON public.personal_reminders FOR SELECT TO authenticated USING (public.can_view_dispute(dispute_id, auth.uid()));
CREATE INDEX personal_reminders_assignee_due ON public.personal_reminders(user_id, remind_at) WHERE NOT done;
CREATE TABLE public.reminder_hub_deliveries (
 reminder_id uuid PRIMARY KEY REFERENCES public.personal_reminders(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','sent','failed','uncertain')),
 claimed_at timestamptz,
 sent_at timestamptz,
 error text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.reminder_hub_deliveries TO service_role;
ALTER TABLE public.reminder_hub_deliveries ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.reminder_user_eligible(_dispute_id uuid, _user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.can_view_dispute(_dispute_id, _user_id)
 AND EXISTS (SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id=u.id WHERE u.id=_user_id AND (u.banned_until IS NULL OR u.banned_until <= now()))
 AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id)
$$;
REVOKE ALL ON FUNCTION public.reminder_user_eligible(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminder_user_eligible(uuid,uuid) TO service_role;
CREATE FUNCTION public.reminder_eligible_users(_dispute_id uuid) RETURNS TABLE(id uuid, full_name text, email text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_view_dispute(_dispute_id,auth.uid()) THEN RAISE EXCEPTION 'Matter access required'; END IF;
 RETURN QUERY SELECT p.id,p.full_name,p.email FROM public.profiles p WHERE public.reminder_user_eligible(_dispute_id,p.id) ORDER BY p.full_name,p.email;
END $$;
REVOKE ALL ON FUNCTION public.reminder_eligible_users(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reminder_eligible_users(uuid) TO authenticated, service_role;
CREATE FUNCTION public.save_personal_reminder(_action text, _data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.personal_reminders; v_id uuid; v_user uuid; v_case uuid; v_due timestamptz; v_lead integer; v_body text; v_quantity integer; v_unit integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF _action='create' THEN
  v_case:=(_data->>'dispute_id')::uuid; v_user:=COALESCE((_data->>'user_id')::uuid,auth.uid());
  IF NOT public.can_view_dispute(v_case,auth.uid()) OR NOT public.reminder_user_eligible(v_case,v_user) THEN RAISE EXCEPTION 'Assignee must be active and have matter access'; END IF;
  v_body:=btrim(_data->>'body'); v_due:=(_data->>'due_at')::timestamptz; v_lead:=COALESCE((_data->>'lead_minutes')::integer,0);
  INSERT INTO public.personal_reminders(dispute_id,user_id,user_email,created_by,created_by_email,body,due_at,lead_minutes,remind_at)
  VALUES(v_case,v_user,(SELECT email FROM public.profiles WHERE id=v_user),auth.uid(),(SELECT email FROM public.profiles WHERE id=auth.uid()),v_body,v_due,v_lead,v_due-make_interval(mins=>v_lead)) RETURNING id INTO v_id;
  INSERT INTO public.reminder_hub_deliveries(reminder_id) VALUES(v_id);
  RETURN v_id;
 END IF;
 SELECT * INTO r FROM public.personal_reminders WHERE id=(_data->>'id')::uuid FOR UPDATE;
 IF r.id IS NULL OR NOT public.can_view_dispute(r.dispute_id,auth.uid()) OR auth.uid() NOT IN (r.created_by,r.user_id) THEN RAISE EXCEPTION 'Reminder permission denied'; END IF;
 IF _action='delete' THEN DELETE FROM public.personal_reminders WHERE id=r.id; RETURN r.id;
 ELSIF _action='done' THEN UPDATE public.personal_reminders SET done=(_data->>'done')::boolean,updated_at=now() WHERE id=r.id;
 ELSIF _action='snooze' THEN
  v_quantity:=(_data->>'quantity')::integer;
  v_unit:=CASE _data->>'unit' WHEN 'minutes' THEN 1 WHEN 'hours' THEN 60 WHEN 'days' THEN 1440 WHEN 'weeks' THEN 10080 WHEN 'months' THEN 43200 END;
  IF v_quantity IS NULL OR v_quantity<1 OR v_unit IS NULL THEN RAISE EXCEPTION 'Invalid snooze'; END IF;
  UPDATE public.personal_reminders SET remind_at=now()+make_interval(mins=>v_quantity*v_unit),notified_at=NULL,updated_at=now() WHERE id=r.id;
 ELSIF _action='edit' THEN
  v_user:=COALESCE((_data->>'user_id')::uuid,r.user_id);
  IF NOT public.reminder_user_eligible(r.dispute_id,v_user) THEN RAISE EXCEPTION 'Assignee must be active and have matter access'; END IF;
  v_due:=(_data->>'due_at')::timestamptz; v_lead:=(_data->>'lead_minutes')::integer;
  UPDATE public.personal_reminders SET body=btrim(_data->>'body'),due_at=v_due,lead_minutes=v_lead,user_id=v_user,user_email=(SELECT email FROM public.profiles WHERE id=v_user),remind_at=CASE WHEN due_at IS DISTINCT FROM v_due OR lead_minutes IS DISTINCT FROM v_lead THEN v_due-make_interval(mins=>v_lead) ELSE remind_at END,notified_at=CASE WHEN due_at IS DISTINCT FROM v_due OR lead_minutes IS DISTINCT FROM v_lead OR user_id IS DISTINCT FROM v_user THEN NULL ELSE notified_at END,updated_at=now() WHERE id=r.id;
 ELSE RAISE EXCEPTION 'Invalid reminder action'; END IF;
 RETURN r.id;
END $$;
REVOKE ALL ON FUNCTION public.save_personal_reminder(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_personal_reminder(text,jsonb) TO authenticated, service_role;
CREATE FUNCTION public.claim_due_reminder(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed uuid;
BEGIN
 UPDATE public.personal_reminders SET notified_at=now() WHERE id=_id AND user_id=auth.uid() AND NOT done AND remind_at<=now() AND notified_at IS NULL AND public.can_view_dispute(dispute_id,auth.uid()) RETURNING id INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_due_reminder(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_due_reminder(uuid) TO authenticated, service_role;