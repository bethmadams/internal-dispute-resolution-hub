import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { rawStageEmail, stageEmail } from './stage-email';

export async function sendQueuedStageEmail(client: SupabaseClient<Database>, id: string, origin: string) {
  const { data: item, error } = await client.from('stage_email_queue').select('*').eq('id', id).eq('status','pending').maybeSingle();
  if (error) throw error;
  if (!item) return { status: 'unavailable' };
  const { data: matter } = await client.from('disputes').select('*').eq('id',item.dispute_id).maybeSingle();
  if (!matter) return { status:'unavailable' };
  if (matter.archived_at || matter.stage === 'Closed' || (item.stage !== 'New Submission' && matter.stage !== item.stage)) {
    await client.from('stage_email_queue').update({status:'skipped',error:'Case is closed, archived or has moved past this email stage.'}).eq('id',id).eq('status','pending');
    return { status:'skipped' };
  }
  const { data: profile } = matter.assigned_to ? await client.from('profiles').select('email').eq('id',matter.assigned_to).maybeSingle() : {data:null};
  const { data: response } = await client.from('case_tasks').select('due_at').eq('dispute_id',matter.id).eq('template_key','response').maybeSingle();
  let message;
  try { message = stageEmail(matter,item.stage,profile?.email ?? null,origin,response?.due_at ?? null); }
  catch (error) {
    await client.from('stage_email_queue').update({status:'blocked',error:error instanceof Error ? error.message : 'Recipient missing'}).eq('id',id).eq('status','pending');
    return {status:'blocked'};
  }
  const key = process.env['GOOGLE_MAIL_API_KEY'];
  const gatewayKey = process.env['LOVABLE_API_KEY'];
  if (!key || !gatewayKey) throw new Error('Gmail sending is not configured');
  const {data: claim} = await client.from('stage_email_queue').update({status:'sending',error:null}).eq('id',id).eq('status','pending').select('id').maybeSingle();
  if (!claim) return {status:'already_claimed'};
  try {
    const result = await fetch('https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send', {method:'POST', headers:{Authorization:`Bearer ${gatewayKey}`,'X-Connection-Api-Key':key,'Content-Type':'application/json'},body:JSON.stringify({raw:rawStageEmail(message)}),signal:AbortSignal.timeout(20000)});
    if (!result.ok) {
      const errorBody = await result.text();
      console.error(`Gmail send failed [${result.status}]: ${errorBody}`);
      await client.from('stage_email_queue').update({status:'failed',error:`Gmail [${result.status}]: ${errorBody.slice(0,1500)}`}).eq('id',id);
      return {status:'failed'};
    }
    const data = await result.json() as {id?:string};
    if (!data.id) throw new Error('Gmail accepted the request without a message identifier');
    const sentAt = new Date().toISOString();
    const recorded = await client.rpc('record_stage_email_sent',{_queue_id:id,_gmail_id:data.id,_sent_at:sentAt});
    if (recorded.error) throw recorded.error;
    await client.from('case_communications').insert({dispute_id:matter.id,kind:'email',recipients:[...message.to,...message.cc].join(', '),subject:message.subject,body:message.body,sent_at:sentAt});
    return {status:'sent'};
  } catch(error) {
    // Never replay a timeout or a post-send recording failure: Gmail may have sent it.
    await client.from('stage_email_queue').update({status:'uncertain',error:error instanceof Error ? error.message : 'Delivery could not be confirmed'}).eq('id',id).eq('status','sending');
    return {status:'uncertain'};
  }
}