import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { STAGES, type Dispute, type Stage } from '@/lib/hub';
import { calculateDue } from '@/lib/sop-rules';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function CaseStageChange({ dispute }: { dispute: Dispute }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Stage | null>(null);
  const [sent, setSent] = useState(false);
  const [sentAt, setSentAt] = useState('');
  const startPrehearing = dispute.stage === 'New Submission' && pending === 'In Progress';
  const validSent = Boolean(sentAt && Number.isFinite(new Date(sentAt).getTime()) && new Date(sentAt).getTime() <= Date.now());
  const mutation = useMutation({
    mutationFn: async () => {
      if (!pending) throw new Error('Choose a stage');
      const result = await supabase.rpc('transition_case_stage', {
        _case_id: dispute.id, _expected_stage: dispute.stage, _stage: pending,
        ...(startPrehearing && sent ? { _response_sent_at: new Date(sentAt).toISOString() } : {}),
      });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      setPending(null);
      for (const key of ['dispute','disputes','case_tasks','case-progress','case_audit','notifications']) queryClient.invalidateQueries({ queryKey: [key] });
      toast.success('Stage updated and checklist prepared');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const phase = pending === 'In Progress' ? 'pre-hearing' : pending === 'Hearing Scheduled' ? 'hearing' : pending === 'Appeal Filed' ? 'appeal' : null;
  return <div className="space-y-2">
    <Label>Stage</Label>
    <Select value={dispute.stage} onValueChange={value => { const stage = STAGES.find(stage => stage === value); if (stage && stage !== dispute.stage) { setPending(stage); setSent(false); setSentAt(''); } }}><SelectTrigger aria-label="Case stage"><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
    <Dialog open={Boolean(pending)} onOpenChange={open => { if(!open && !mutation.isPending) setPending(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Move to {pending}</DialogTitle><DialogDescription>{phase ? `Missing ${phase} checklist tasks will be added. Existing due dates, assignments and completed tasks will be retained.` : pending === 'Closed' ? 'Closing removes participant case access. Confirm all required follow-up is complete.' : 'The case stage will be updated.'}</DialogDescription></DialogHeader>
        {startPrehearing && <div className="space-y-4"><Label className="flex items-start gap-2"><Checkbox checked={sent} onCheckedChange={value => setSent(value === true)} />Respondent invitation has already been sent</Label>{sent && <div className="space-y-2"><Label htmlFor="response-sent-at">Invitation sent · local time</Label><Input id="response-sent-at" type="datetime-local" value={sentAt} onChange={event => setSentAt(event.target.value)} />{validSent && <p className="text-sm text-muted-foreground">Response deadline: {new Date(calculateDue(new Date(sentAt).toISOString(), {days:10})).toLocaleString()}</p>}<p className="text-xs text-muted-foreground">An existing response deadline will not be replaced.</p></div>}</div>}
        {(pending === 'In Progress' || pending === 'Awaiting Response') && <p className="text-sm text-muted-foreground">A Regulatory Relations email will be queued to the respondent, copying the complainant, assigned investigator and MB/DMB. {pending === 'Awaiting Response' ? 'The 10-calendar-day response deadline starts after Gmail accepts the invitation; an existing deadline is retained.' : 'This status email does not start a response deadline.'}</p>}
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setPending(null)}>Cancel</Button><Button disabled={mutation.isPending || (startPrehearing && sent && !validSent)} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Updating…' : 'Confirm stage change'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}