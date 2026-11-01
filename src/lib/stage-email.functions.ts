import { createServerFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { hubPortalOrigin } from './hub-notify';

export const dispatchStageEmail = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),retry:z.boolean().optional()})).handler(async ({data,context}) => {
  const {data:staff} = await context.supabase.rpc('is_staff',{_user_id:context.userId});
  if (!staff) throw new Error('Staff access required');
  const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
  if (data.retry) await supabaseAdmin.from('stage_email_queue').update({status:'pending',error:null}).eq('id',data.id).in('status',['blocked','failed']);
  const {sendQueuedStageEmail} = await import('./stage-email.server');
  return sendQueuedStageEmail(supabaseAdmin,data.id,hubPortalOrigin(getRequestUrl()));
});

// A stored case ID can only deliver its once-queued initial receipt; no caller supplied content or recipients.
export const deliverStageReceipt = createServerFn({method:'POST'}).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data}) => {
  const {supabaseAdmin} = await import('@/integrations/supabase/client.server');
  const {data:item} = await supabaseAdmin.from('stage_email_queue').select('id').eq('dispute_id',data.id).eq('stage','New Submission').eq('status','pending').maybeSingle();
  if (!item) return {status:'unavailable'};
  const {sendQueuedStageEmail} = await import('./stage-email.server');
  return sendQueuedStageEmail(supabaseAdmin,item.id,hubPortalOrigin(getRequestUrl()));
});