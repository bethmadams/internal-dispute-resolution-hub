import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { hasStaffRole } from './case-rules';

export const getCaseProgress = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase;
    const roles = await client.from('user_roles').select('role').eq('user_id', context.userId);
    if (roles.error) throw roles.error;
    const isStaff = hasStaffRole((roles.data ?? []).map(row => row.role));
    const [cases, profiles, tasks, workflows] = await Promise.all([
      client.from('disputes').select('id,case_number,title,filed_by,respondent,state,stage,assigned_to,hearing_date,archived_at,updated_at').order('updated_at', { ascending: false }),
      client.from('profiles').select('id,full_name,email'),
      isStaff ? client.from('case_tasks').select('*') : Promise.resolve({ data: [], error: null }),
      isStaff ? client.from('case_workflow').select('*') : Promise.resolve({ data: [], error: null }),
    ]);
    for (const result of [cases, profiles, tasks, workflows]) if (result.error) throw result.error;
    return { cases: cases.data ?? [], profiles: profiles.data ?? [], tasks: tasks.data ?? [], workflows: workflows.data ?? [], isStaff };
  });