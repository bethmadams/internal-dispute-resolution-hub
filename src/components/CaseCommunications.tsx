import { useState } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { communicationsQuery } from '@/lib/sop-data';
import { formatDateTime } from '@/lib/hub';
const templates:Record<string,{subject:string;body:string}>={
 'Hearing request':{subject:'Internal Dispute Resolution hearing request',body:'Following the unsuccessful state-level mediation, please submit the Internal Dispute Resolution Hearing Request and signed binding agreement. Participation is voluntary.'},
 'Response request':{subject:'Internal Dispute Resolution response requested',body:'Please submit your Hearing Response, signed binding agreement, and all defense documents by [confirmed deadline].'},
 'Panel invitation':{subject:'Internal Dispute Resolution panel invitation',body:'Please confirm your availability and disclose any state-license or team-license conflict for this matter.'},
 'Hearing notice':{subject:'Internal Dispute Resolution hearing schedule',body:'The hearing is scheduled for [date and time, timezone] in [eXp.world room]. Phone access: [details]. Cameras are required.'},
 'Decision review':{subject:'Hearing Award and Final Disposition — review',body:'Please review the proposed decision and acknowledge receipt within 48 hours. The decision has not yet been sent to the parties.'},
 'Decision delivery':{subject:'Hearing Award and Final Disposition',body:'Please find the reviewed decision for this matter. Appeal deadline: [confirmed deadline]. An appeal must identify genuinely new information previously unavailable.'},
 'Hub chat / filing':{subject:'Internal Dispute Hearing — case coordination',body:'Record creation of the Hub chat, Enterprise or Hubspot filing, and the participants included.'},
};
export function CaseCommunications({caseId}:{caseId:string}){
 const qc=useQueryClient();const {data:records=[]}=useQuery(communicationsQuery(caseId));const [kind,setKind]=useState('Hearing request');const [recipients,setRecipients]=useState('');const [subject,setSubject]=useState(templates[kind]?.subject??'');const [body,setBody]=useState(templates[kind]?.body??'');const [sent,setSent]=useState('');
 const save=useMutation({mutationFn:async()=>{const r=await supabase.from('case_communications').insert({dispute_id:caseId,kind,recipients,subject,body,sent_at:sent?new Date(sent).toISOString():null});if(r.error)throw r.error;},onSuccess:()=>{qc.invalidateQueries({queryKey:['case_communications',caseId]});toast.success('Communication recorded');},onError:(e:Error)=>toast.error(e.message)});
 return <section className="space-y-4 border-t border-border pt-6"><h2 className="text-xl font-semibold">Communications</h2><p className="text-sm text-muted-foreground">Draft templates · send through your approved email service, then record delivery here.</p><Select value={kind} onValueChange={v=>{setKind(v);setSubject(templates[v]?.subject??'');setBody(templates[v]?.body??'');}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.keys(templates).map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><Label htmlFor="recipients">Recipients</Label><Input id="recipients" value={recipients} onChange={e=>setRecipients(e.target.value)}/><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={e=>setSubject(e.target.value)}/><Label htmlFor="message-body">Message</Label><Textarea id="message-body" rows={5} value={body} onChange={e=>setBody(e.target.value)}/><Label htmlFor="sent-at">Sent / action completed · local time</Label><Input id="sent-at" type="datetime-local" value={sent} onChange={e=>setSent(e.target.value)}/><div className="flex gap-2"><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(`${subject}\n\n${body}`);toast.success('Draft copied');}catch{toast.error('Unable to copy draft');}}}><Copy className="size-4"/>Copy draft</Button><Button disabled={!recipients.trim()||!subject.trim()||save.isPending} onClick={()=>save.mutate()}>Record communication</Button></div><ul className="divide-y divide-border">{records.map(r=><li key={r.id} className="py-3"><p className="font-medium">{r.subject}</p><p className="text-xs text-muted-foreground">{r.recipients} · {r.sent_at?`Sent ${formatDateTime(r.sent_at)}`:'Draft / not sent'}</p><details className="mt-2 text-sm"><summary className="cursor-pointer">Message</summary><p className="mt-2 whitespace-pre-wrap">{r.body}</p></details></li>)}</ul></section>;
}