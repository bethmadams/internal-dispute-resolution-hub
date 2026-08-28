CREATE TABLE public.territory_assignments (
  state text PRIMARY KEY,
  investigator_name text NOT NULL,
  investigator_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.territory_assignments TO authenticated;
GRANT ALL ON public.territory_assignments TO service_role;

ALTER TABLE public.territory_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY territory_select ON public.territory_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY territory_manage ON public.territory_assignments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER territory_assignments_updated_at BEFORE UPDATE ON public.territory_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.territory_assignments (state, investigator_name, investigator_email) VALUES
('Washington','Anna','anna.luedke@exprealty.net'),
('Montana','Anna','anna.luedke@exprealty.net'),
('Colorado','Anna','anna.luedke@exprealty.net'),
('Arizona','Anna','anna.luedke@exprealty.net'),
('Texas','Anna','anna.luedke@exprealty.net'),
('Hawaii','Anna','anna.luedke@exprealty.net'),
('Maine','Anna','anna.luedke@exprealty.net'),
('New Hampshire','Anna','anna.luedke@exprealty.net'),
('Massachusetts','Anna','anna.luedke@exprealty.net'),
('Rhode Island','Anna','anna.luedke@exprealty.net'),
('Connecticut','Anna','anna.luedke@exprealty.net'),
('New York','Anna','anna.luedke@exprealty.net'),
('Pennsylvania','Anna','anna.luedke@exprealty.net'),
('New Jersey','Anna','anna.luedke@exprealty.net'),
('Delaware','Anna','anna.luedke@exprealty.net'),
('Maryland','Anna','anna.luedke@exprealty.net'),
('District of Columbia','Anna','anna.luedke@exprealty.net'),
('Virginia','Anna','anna.luedke@exprealty.net'),
('Oregon','Carlo',NULL),
('Idaho','Carlo',NULL),
('Wyoming','Carlo',NULL),
('Nevada','Carlo',NULL),
('California','Carlo',NULL),
('Utah','Carlo',NULL),
('North Dakota','Carlo',NULL),
('South Dakota','Carlo',NULL),
('Nebraska','Carlo',NULL),
('New Mexico','Carlo',NULL),
('Alaska','Carlo',NULL),
('Vermont','Nick',NULL),
('Minnesota','Nick',NULL),
('Wisconsin','Nick',NULL),
('Michigan','Nick',NULL),
('Iowa','Nick',NULL),
('Illinois','Nick',NULL),
('Indiana','Nick',NULL),
('Ohio','Nick',NULL),
('Kansas','Nick',NULL),
('Missouri','Nick',NULL),
('Kentucky','Nick',NULL),
('West Virginia','Nick',NULL),
('Oklahoma','Nick',NULL),
('Arkansas','Nick',NULL),
('Tennessee','Nick',NULL),
('North Carolina','Nick',NULL),
('South Carolina','Nick',NULL),
('Mississippi','Nick',NULL),
('Alabama','Nick',NULL),
('Georgia','Nick',NULL),
('Louisiana','Nick',NULL),
('Florida','Nick',NULL);

CREATE OR REPLACE FUNCTION public.auto_assign_by_territory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF NEW.assigned_to IS NULL AND NEW.state IS NOT NULL THEN
    SELECT p.id INTO target
      FROM public.territory_assignments t
      JOIN public.profiles p ON lower(p.email) = lower(t.investigator_email)
     WHERE lower(t.state) = lower(NEW.state)
     LIMIT 1;
    IF target IS NOT NULL THEN
      NEW.assigned_to := target;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER disputes_auto_assign_territory
BEFORE INSERT ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_by_territory();