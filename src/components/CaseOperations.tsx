import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { zipSync, strToU8 } from 'fflate';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { auditQuery, saveFile, workflowQuery } from '@/lib/sop-data';
import { calendarInvite } from '@/lib/sop-rules';
import { attachmentsQuery,downloadAttachment } from '@/lib/intake';
import { caseTitle } from '@/lib/case-rules';
import { formatDateTime, type Dispute } from '@/lib/hub';

export function CaseOperations({dispute}:{dispute:Dispute}){
 const {data:audit=[]}=useQuery(auditQuery(dispute.id));const {data:workflow}=useQuery(workflowQuery(dispute.id));const {data:files=[]}=useQuery(attachmentsQuery(dispute.id));const [busy,setBusy]=useState(false);
 const exportCase=async(packetOnly:boolean)=>{
  setBusy(true);try{
   // Every query and signed file URL is authorized by the signed-in user's RLS.
   const [tasks,panel,communications,notes,responses,appeals]=await Promise.all([
    supabase.from('case_tasks').select('*').eq('dispute_id',dispute.id),supabase.from('case_panelists').select('*').eq('dispute_id',dispute.id),supabase.from('case_communications').select('*').eq('dispute_id',dispute.id),supabase.from('dispute_notes').select('*').eq('dispute_id',dispute.id),supabase.from('dispute_responses').select('*').eq('dispute_id',dispute.id),supabase.from('dispute_appeals').select('*').eq('dispute_id',dispute.id)]);
   if([tasks,panel,communications,notes,responses,appeals].some(r=>r.error))throw new Error('Unable to read case records');
   const entries:Record<string,Uint8Array>={};
   const selected=packetOnly?files.filter(f=>f.in_hearing_packet):files;
   entries['case-record.json']=strToU8(JSON.stringify(packetOnly?{case_number:dispute.case_number,title:caseTitle(dispute.filed_by,dispute.respondent,dispute.title),documents:selected}:{dispute,workflow,tasks:tasks.data,panel:panel.data,communications:communications.data,notes:notes.data,responses:responses.data,appeals:appeals.data,audit,documents:selected},null,2));
   for(const file of selected){const url=await downloadAttachment(file.file_path);const r=await fetch(url);if(!r.ok)throw new Error(`Unable to download ${file.file_name}`);entries[`documents/${file.id}-${file.file_name.replace(/[\\/]/g,'_')}`]=new Uint8Array(await r.arrayBuffer());}
   const zip=zipSync(entries);const buffer=new ArrayBuffer(zip.byteLength);new Uint8Array(buffer).set(zip);const url=URL.createObjectURL(new Blob([buffer],{type:'application/zip'}));const link=document.createElement('a');link.href=url;link.download=`${dispute.case_number}-${packetOnly?'hearing-packet':'case-archive'}.zip`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast.success('Case packet downloaded');
  }catch(e){toast.error((e as Error).message);}finally{setBusy(false);}
 };
 return <section className="space-y-4 border-t border-border pt-6"><h2 className="text-xl font-semibold">Case history & downloads</h2><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={()=>exportCase(false)}><Download className="size-4"/>{busy?'Preparing…':'Export private case archive'}</Button><Button variant="outline" disabled={busy||!files.some(f=>f.in_hearing_packet)} onClick={()=>exportCase(true)}><Download className="size-4"/>Export selected hearing packet</Button><Button variant="outline" disabled={!dispute.hearing_date} onClick={()=>{if(!dispute.hearing_date)return;saveFile(calendarInvite(`Internal Dispute Hearing — ${caseTitle(dispute.filed_by,dispute.respondent,dispute.title)}`,dispute.hearing_date,workflow?.meeting_duration_minutes??60,workflow?.meeting_location??'',`${dispute.case_number}. Cameras required.`),`${dispute.case_number}-hearing.ics`,'text/calendar');}}><CalendarDays className="size-4"/>Calendar invitation</Button></div><p className="text-xs text-muted-foreground">Private case archives include staff records. Hearing packets include only documents selected in the evidence register.</p><ul className="max-h-80 divide-y divide-border overflow-auto">{audit.map(a=><li key={a.id} className="py-3"><p className="text-sm">{a.action} · {a.record_type.replace(/_/g,' ')}</p><p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)} · {a.actor_id??'System'}</p><details className="text-xs"><summary className="cursor-pointer">Recorded changes</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify({before:a.before_data,after:a.after_data},null,2)}</pre></details></li>)}</ul></section>;
}