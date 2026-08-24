CREATE OR REPLACE FUNCTION public.assign_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text := 'IDR-' || to_char(now(), 'YYYY') || '-';
  next_num int;
BEGIN
  IF NEW.case_number IS NULL OR btrim(NEW.case_number) = '' THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(case_number, '^' || prefix, ''), '')::int), 0) + 1
      INTO next_num
      FROM public.disputes
      WHERE case_number LIKE prefix || '%'
        AND regexp_replace(case_number, '^' || prefix, '') ~ '^[0-9]+$';
    NEW.case_number := prefix || lpad(next_num::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_case_number() FROM public, anon, authenticated;

CREATE TRIGGER disputes_assign_case_number
  BEFORE INSERT ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.assign_case_number();