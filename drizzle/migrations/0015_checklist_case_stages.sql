ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Eligibility Review';
ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Evidence Review';
ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Panel Selection';
ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Decision Review';
ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Appeal Window';
ALTER TYPE public.dispute_stage ADD VALUE IF NOT EXISTS 'Compliance Follow-up';
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.initialize_stage_checklist()'::regprocedure) INTO definition;
 definition := replace(definition,
 'phase_name:=CASE NEW.stage::text WHEN ''In Progress'' THEN ''Pre-hearing'' WHEN ''Hearing Scheduled'' THEN ''Hearing'' WHEN ''Appeal Filed'' THEN ''Appeal'' END;',
 'phase_name:=CASE WHEN NEW.stage::text IN (''In Progress'',''Eligibility Review'',''Awaiting Response'',''Evidence Review'',''Panel Selection'') THEN ''Pre-hearing'' WHEN NEW.stage::text=''Hearing Scheduled'' THEN ''Hearing'' WHEN NEW.stage::text IN (''Decision Review'',''Compliance Follow-up'') THEN ''Post-hearing'' WHEN NEW.stage::text IN (''Appeal Filed'',''Appeal Window'') THEN ''Appeal'' END;');
 EXECUTE definition;
END $migration$;