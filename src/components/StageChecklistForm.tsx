import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCcw, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CHECKLIST_STAGES, CASE_STAGE_GUIDE, type CaseStage } from '@/lib/case-stages';
import { CHECKLIST_QUESTIONS, checklistProgress, type ChecklistAnswers, type ChecklistAnswer } from '@/lib/checklist-questions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StageChecklistForm({ caseId, stage, onStageChange, onOpenRecords }: { caseId: string; stage: CaseStage; onStageChange: (stage: CaseStage) => void; onOpenRecords: () => void }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['case_checklist_forms',caseId,stage], queryFn: async () => { const r = await supabase.from('case_checklist_forms').select('*').eq('dispute_id',caseId).eq('stage',stage).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const [answers,setAnswers] = useState<ChecklistAnswers>({});
  const [version,setVersion] = useState(0);
  const [dirty,setDirty] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => { if (query.isSuccess && !dirty) { setAnswers((query.data?.answers ?? {}) as ChecklistAnswers); setVersion(query.data?.version ?? 0); } }, [query.data,query.isSuccess,dirty]);
  const save = useMutation({ mutationFn: async () => { const r = await supabase.rpc('save_stage_checklist', { _case_id: caseId, _stage: stage, _answers: answers, _version: version }); if (r.error) throw r.error; return r.data; }, onSuccess: () => { setDirty(false); void qc.invalidateQueries({queryKey:['case_checklist_forms',caseId,stage]}); void qc.invalidateQueries({queryKey:['case_audit',caseId]}); toast.success('Checklist answers saved'); }, onError: (e: Error) => setError(e.message) });
  const change = (key: string, values: Partial<ChecklistAnswer>) => { setDirty(true); setAnswers(prev => ({...prev,[key]:{status:'pending',notes:'',...prev[key],...values}})); };
  const progress = checklistProgress(stage,answers);
  return <section className="space-y-5">
    <h2 className="text-lg font-semibold">{stage} checklist</h2>
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0 space-y-2"><Label htmlFor="checklist-stage">Checklist section</Label><Select value={stage} onValueChange={next => { if (dirty && !window.confirm('Discard unsaved checklist answers?')) return; if(CHECKLIST_STAGES.includes(next as CaseStage))onStageChange(next as CaseStage); }}><SelectTrigger id="checklist-stage" className="w-64 max-w-full"><SelectValue /></SelectTrigger><SelectContent>{CHECKLIST_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><span className="text-sm text-muted-foreground">{progress.answered} / {progress.total} answered{dirty ? ' · Unsaved changes' : ''}</span></div>
    <Button variant="outline" size="sm" onClick={onOpenRecords}><ArrowUpRight className="size-4" />{CASE_STAGE_GUIDE[stage].action === 'Open pre-hearing checklist' || CASE_STAGE_GUIDE[stage].action === 'Open hearing checklist' ? 'Open operational records' : CASE_STAGE_GUIDE[stage].action}</Button>
    {query.isPending ? <p className="text-sm text-muted-foreground">Loading checklist answers…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Unable to load saved answers.</p> : <form onSubmit={e => { e.preventDefault(); setError(''); save.mutate(); }}>
      <fieldset disabled={save.isPending} className="divide-y divide-border">
        {CHECKLIST_QUESTIONS[stage].map((question,index) => { const answer = answers[question.key] ?? {status:'pending',notes:''}; return <div key={question.key} className="space-y-3 py-5"><Label htmlFor={`answer-${question.key}`} className="text-sm leading-relaxed">{index+1}. {question.question}</Label>{question.requirement && <p className="text-xs leading-relaxed text-muted-foreground">{question.requirement}</p>}<Select value={answer.status} onValueChange={status => change(question.key,{status: status as ChecklistAnswer['status']})}><SelectTrigger id={`answer-${question.key}`} className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Not answered</SelectItem><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No / follow-up needed</SelectItem><SelectItem value="na">Not applicable</SelectItem></SelectContent></Select><Label htmlFor={`notes-${question.key}`} className="text-xs text-muted-foreground">Notes, confirmed dates and document references</Label><Textarea id={`notes-${question.key}`} value={answer.notes} maxLength={6000} rows={2} onChange={e=>change(question.key,{notes:e.target.value})} /></div>; })}
      </fieldset>
      {error && <p role="alert" className="my-3 text-sm text-destructive">{error}</p>}
      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-card py-4"><Button type="submit" disabled={!dirty || save.isPending}><Save className="size-4" />{save.isPending?'Saving…':'Save checklist answers'}</Button><Button type="button" variant="outline" disabled={save.isPending} onClick={() => { if (dirty && !window.confirm('Discard unsaved checklist answers?')) return; setDirty(false); setError(''); void query.refetch(); }}><RotateCcw className="size-4" />Reload saved answers</Button></div>
    </form>}
  </section>;
}