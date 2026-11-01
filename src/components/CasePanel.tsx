import { useState } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { US_STATES } from '@/lib/intake';
import { panelQuery,type Panelist } from '@/lib/sop-data';
import { panelConflict } from '@/lib/sop-rules';

export function CasePanel({caseId,state}:{caseId:string;state:string|null}){
 const qc=useQueryClient();const {data:panel=[]}=useQuery(panelQuery(caseId));
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [licensed,setLicensed]=useState<string[]>([]);const [team,setTeam]=useState<string[]>([]);const [approved,setApproved]=useState(false);
 const save=useMutation({mutationFn:async(action:()=>PromiseLike<{error:unknown}>)=>{const r=await action();if(r.error)throw r.error;},onSuccess:()=>{qc.invalidateQueries({queryKey:['case_panelists',caseId]});toast.success('Panel saved');},onError:(e:Error)=>toast.error(e.message)});
 const patch=(p:Panelist,v:Partial<Panelist>)=>save.mutate(()=>supabase.from('case_panelists').update(v).eq('id',p.id));
 return <section className="space-y-4 border-t border-border pt-6"><h2 className="text-xl font-semibold">Hearing panel</h2><p className="text-sm text-muted-foreground">{panel.filter(p=>['Invited','Accepted'].includes(p.status)).length} / 5 active panelists · Dispute state: {state??'Not recorded'}</p>
 <ul className="divide-y divide-border">{panel.map(p=><li key={p.id} className="space-y-3 py-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{p.full_name}</h3><p className="text-xs text-muted-foreground">{p.email} · Licensed: {p.licensed_states.join(', ')||'None recorded'} · Team: {p.team_licensed_states.join(', ')||'None recorded'}</p></div><Badge variant="outline" className={panelConflict(state,p.licensed_states,p.team_licensed_states)?'text-destructive':''}>{panelConflict(state,p.licensed_states,p.team_licensed_states)?'State conflict':'No recorded conflict'}</Badge></div>
 <div className="flex flex-wrap items-center gap-4"><Select value={p.status} onValueChange={v=>patch(p,{status:v})}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent>{['Proposed','Invited','Accepted','Declined'].map(v=><SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select><Label className="flex gap-2"><Checkbox checked={p.approved} onCheckedChange={v=>patch(p,{approved:v===true})}/>Approved panelist</Label><Label className="flex gap-2"><Checkbox checked={p.is_chair} onCheckedChange={v=>patch(p,{is_chair:v===true})}/>Chair</Label></div>
 <Input aria-label={`Challenge for ${p.full_name}`} placeholder="Party challenge and reason" defaultValue={p.challenge} onBlur={e=>{if(e.target.value!==p.challenge)patch(p,{challenge:e.target.value});}}/><Select value={p.challenge_outcome} onValueChange={v=>patch(p,{challenge_outcome:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['None','Pending','Dismissed','Upheld'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
 <StateList title={`Licensed states for ${p.full_name}`} selected={p.licensed_states} onChange={v=>patch(p,{licensed_states:v})}/><StateList title={`Team licensed states for ${p.full_name}`} selected={p.team_licensed_states} onChange={v=>patch(p,{team_licensed_states:v})}/>
 </li>)}</ul>
 <div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Panelist name" placeholder="Panelist name" value={name} onChange={e=>setName(e.target.value)}/><Input aria-label="Panelist email" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><StateList title="Panelist licensed states" selected={licensed} onChange={setLicensed}/><StateList title="Team member licensed states" selected={team} onChange={setTeam}/><Label className="flex gap-2"><Checkbox checked={approved} onCheckedChange={v=>setApproved(v===true)}/>On the approved panelist list</Label><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate(()=>supabase.from('case_panelists').insert({dispute_id:caseId,full_name:name.trim(),email,licensed_states:licensed,team_licensed_states:team,approved}))}>Add proposed panelist</Button>
 </section>;
}
export function StateList({title,selected,onChange}:{title:string;selected:string[];onChange:(v:string[])=>void}){return <details className="border-b border-border pb-2"><summary className="cursor-pointer text-sm font-medium">{title} ({selected.length})</summary><div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">{US_STATES.map(s=><Label key={s} className="flex items-center gap-2 text-xs"><Checkbox checked={selected.includes(s)} onCheckedChange={v=>onChange(v?[...selected,s]:selected.filter(x=>x!==s))}/>{s}</Label>)}</div></details>;}