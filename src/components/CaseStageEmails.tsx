import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {dispatchStageEmail} from '@/lib/stage-email.functions';
import type {Dispute} from '@/lib/hub';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export function CaseStageEmails({dispute}:{dispute:Dispute}) {
  const queryClient=useQueryClient();
  const dispatch=useServerFn(dispatchStageEmail);
  const [name,setName]=useState(dispute.mb_dmb_name ?? '');
  const [email,setEmail]=useState(dispute.mb_dmb_email ?? '');
  const {data=[]}=useQuery({queryKey:['stage-emails',dispute.id],queryFn:async()=>{const result=await supabase.from('stage_email_queue').select('*').eq('dispute_id',dispute.id).order('created_at');if(result.error)throw result.error;return result.data;},refetchInterval:30000});
  const save=useMutation({mutationFn:async()=>{const {error}=await supabase.from('disputes').update({mb_dmb_name:name.trim() || null,mb_dmb_email:email.trim() || null}).eq('id',dispute.id);if(error)throw error;},onSuccess:()=>{void queryClient.invalidateQueries({queryKey:['dispute',dispute.id]});toast.success('MB/DMB contact saved');},onError:(error:Error)=>toast.error(error.message)});
  const retry=useMutation({mutationFn:(id:string)=>dispatch({data:{id,retry:true}}),onSuccess:()=>{void queryClient.invalidateQueries({queryKey:['stage-emails',dispute.id]});void queryClient.invalidateQueries({queryKey:['case_tasks']});void queryClient.invalidateQueries({queryKey:['case_communications']});},onError:(error:Error)=>toast.error(error.message)});
  return <section className="space-y-5 border-b border-border py-6"><h2 className="text-lg font-semibold">Stage emails</h2><form className="grid gap-4 sm:grid-cols-2" onSubmit={event=>{event.preventDefault();save.mutate();}}><div className="space-y-2"><Label htmlFor="case-broker-name">MB/DMB name</Label><Input id="case-broker-name" value={name} onChange={event=>setName(event.target.value)}/></div><div className="space-y-2"><Label htmlFor="case-broker-email">MB/DMB email address</Label><Input id="case-broker-email" type="email" value={email} onChange={event=>setEmail(event.target.value)}/></div><Button type="submit" disabled={save.isPending} className="justify-self-start">Save MB/DMB contact</Button></form><div className="divide-y divide-border">{data.map(item=><div key={item.id} className="py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>{item.stage}</span><span className="capitalize">{item.status}</span>{['blocked','failed'].includes(item.status) && <Button variant="outline" size="sm" disabled={retry.isPending} onClick={()=>retry.mutate(item.id)}>Retry email</Button>}</div>{item.sent_at && <p className="mt-1 text-muted-foreground">Sent {new Date(item.sent_at).toLocaleString()}</p>}{item.error && <p className="mt-1 break-words text-destructive">{item.error}</p>}</div>)}</div></section>;
}