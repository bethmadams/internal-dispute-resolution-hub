import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Plus, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { tasksQuery, type Task } from '@/lib/sop-data';
import { SOP_TASKS, SOP_TIMELINES, calculateDue, deadlineState } from '@/lib/sop-rules';
import { profilesQuery } from '@/lib/hub';

export function CaseTasks({caseId}:{caseId:string}) {
  const queryClient=useQueryClient(); const {user}=useCurrentUser();
  const {data:tasks=[],error}=useQuery(tasksQuery(caseId)); const {data:profiles=[]}=useQuery(profilesQuery);
  const [phase,setPhase]=useState('Pre-hearing'); const [title,setTitle]=useState('');
  const [clock,setClock]=useState('response'); const [start,setStart]=useState(''); const [holidays,setHolidays]=useState('');
  const mutation=useMutation({mutationFn:async (action:()=>PromiseLike<{error:unknown}>)=>{const r=await action(); if(r.error) throw r.error;},onSuccess:()=>{queryClient.invalidateQueries({queryKey:['case_tasks']});toast.success('Tasks saved');},onError:(e:Error)=>toast.error(e.message)});
  const patch=(task:Task,values:Partial<Task>)=>mutation.mutate(()=>supabase.from('case_tasks').update(values).eq('id',task.id));
  const generate=()=>mutation.mutate(()=>supabase.from('case_tasks').upsert(SOP_TASKS.map(t=>({dispute_id:caseId,phase:t.phase,title:t.title,template_key:t.key})),{onConflict:'dispute_id,template_key',ignoreDuplicates:true}));
  const rule=SOP_TIMELINES.find(r=>r.key===clock);
  return <section className="space-y-5 border-t border-border pt-6">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">SOP tasks & deadlines</h2><Button variant="outline" onClick={generate} disabled={mutation.isPending}><CheckCheck className="size-4"/>Add SOP tasks</Button></div>
    <p className="text-sm text-muted-foreground">Uploaded SOP governs deadlines · supplemented by current Drive checklists</p>
    {error && <p className="text-destructive">Unable to load tasks.</p>}
    <div className="flex flex-wrap gap-2">{['Pre-hearing','Hearing','Post-hearing','Appeal'].map(p=><Button key={p} variant={p===phase?'default':'outline'} onClick={()=>setPhase(p)}>{p}</Button>)}</div>
    <ul className="divide-y divide-border">{tasks.filter(t=>t.phase===phase).map(task=><li key={task.id} className="space-y-3 py-4">
      <div className="flex items-start gap-3"><Checkbox aria-label={`Complete ${task.title}`} checked={Boolean(task.completed_at)} onCheckedChange={checked=>patch(task,{completed_at:checked?new Date().toISOString():null,completed_by:checked?user?.id??null:null})}/><span className="flex-1 text-sm font-medium">{task.title}</span><Badge variant="outline" className={deadlineState(task.due_at,task.completed_at)==='Overdue'?'text-destructive':''}>{deadlineState(task.due_at,task.completed_at)}</Badge></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><Label className="text-xs">Responsible person</Label><Select value={task.assignee_id??'none'} onValueChange={v=>patch(task,{assignee_id:v==='none'?null:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{profiles.map(p=><SelectItem key={p.id} value={p.id}>{p.full_name||p.email}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Due date · local time</Label><Input aria-label={`Due date for ${task.title}`} type="datetime-local" defaultValue={task.due_at?localDate(task.due_at):''} onBlur={e=>patch(task,{due_at:e.target.value?new Date(e.target.value).toISOString():null})}/></div></div>
      <Input aria-label={`Supporting note for ${task.title}`} placeholder="Supporting document or completion note" defaultValue={task.evidence_note} onBlur={e=>{if(e.target.value!==task.evidence_note)patch(task,{evidence_note:e.target.value});}}/>
    </li>)}</ul>
    <div className="flex gap-2"><Input aria-label="New task" placeholder="Additional task" value={title} onChange={e=>setTitle(e.target.value)}/><Button variant="outline" disabled={!title.trim()||mutation.isPending} onClick={()=>{mutation.mutate(()=>supabase.from('case_tasks').insert({dispute_id:caseId,phase,title:title.trim()}));setTitle('');}}><Plus className="size-4"/>Add</Button></div>
    <div className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Deadline calculator</h3><div className="grid gap-3 sm:grid-cols-2"><div><Label>SOP timeline</Label><Select value={clock} onValueChange={setClock}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{SOP_TIMELINES.map(r=><SelectItem key={r.key} value={r.key}>{r.title}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="clock-start">{rule?.anchor} · local time</Label><Input id="clock-start" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div></div><Label htmlFor="holidays">Excluded holidays · YYYY-MM-DD, comma separated</Label><Input id="holidays" value={holidays} onChange={e=>setHolidays(e.target.value)}/><p className="text-xs text-muted-foreground">Business-day calculations exclude weekends and the holidays entered above. Staff confirm the starting event and final due date.</p><Button variant="outline" disabled={!start||!rule||mutation.isPending} onClick={()=>{if(!rule)return;const due=calculateDue(new Date(start).toISOString(),rule,holidays.split(',').map(s=>s.trim()));mutation.mutate(()=>supabase.from('case_tasks').upsert({dispute_id:caseId,template_key:rule.key,phase:rule.phase,title:rule.title,due_at:due},{onConflict:'dispute_id,template_key'}));}}><CalendarClock className="size-4"/>Apply calculated deadline</Button></div>
  </section>;
}
export function localDate(value:string){const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}