import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { STAGES, type Dispute, type Stage } from '@/lib/hub';
import { calculateDue } from '@/lib/sop-rules';
import { dispatchStageEmail } from '@/lib/stage-email.functions';
import { CASE_STAGE_GUIDE, stageChecklistPhase } from '@/lib/case-stages';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function CaseStageChange({ dispute }: { dispute: Dispute }) {
  const queryClient = useQueryClient();
  const dispatchEmail = useServerFn(dispatchStageEmail);
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
      if (['New Submission', 'In Progress', 'Awaiting Response'].includes(pending)) {
        try {
          const { data: queued, error } = await supabase.from('stage_email_queue')
            .select('id,status').eq('dispute_id', dispute.id).eq('stage', pending).maybeSingle();
          if (error || !queued) return 'pending';
          if (queued.status !== 'pending') return queued.status;
          return (await dispatchEmail({ data: { id: queued.id } })).status;
        } catch { return 'pending'; }
      }
      return null;
    },
    onSuccess: (emailStatus) => {
      setPending(null);
      for (const key of ['dispute','disputes','case_tasks','case-progress','case_audit','notifications','pending-stage-emails','stage-emails','case_communications']) queryClient.invalidateQueries({ queryKey: [key] });
      toast.success('Stage updated and checklist prepared');
      if (emailStatus === 'sent') toast.success('Regulatory Relations email sent');
      else if (emailStatus === 'blocked') toast.warning('Email blocked: check respondent, complainant, investigator and MB/DMB email addresses in Stage emails.');
      else if (emailStatus === 'failed') toast.warning('Email was not sent. Review Stage emails and retry.');
      else if (emailStatus === 'uncertain' || emailStatus === 'sending') toast.warning('Email delivery is unconfirmed. Review Stage emails before sending again.');
      else if (emailStatus === 'pending') toast.info('Email remains queued for automatic delivery.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const phase = pending ? stageChecklistPhase(pending) : null;
  return <div className="space-y-2">
    <Label>Stage</Label>
    <Select value={dispute.stage} onValueChange={value => { const stage = STAGES.find(stage => stage === value); if (stage && stage !== dispute.stage) { setPending(stage); setSent(false); setSentAt(''); } }}><SelectTrigger aria-label="Case stage"><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
    <Dialog open={Boolean(pending)} onOpenChange={open => { if(!open && !mutation.isPending) setPending(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Move to {pending}</DialogTitle><DialogDescription>{phase ? `Missing ${phase} checklist tasks will be added. Existing due dates, assignments and completed tasks will be retained.` : pending === 'Closed' ? 'Closing removes participant case access. Confirm all required follow-up is complete.' : 'The case stage will be updated.'}</DialogDescription></DialogHeader>
        {pending && <p className="text-sm">{CASE_STAGE_GUIDE[pending].checkpoint}</p>}
        {startPrehearing && <div className="space-y-4"><Label className="flex items-start gap-2"><Checkbox checked={sent} onCheckedChange={value => setSent(value === true)} />Respondent invitation has already been sent</Label>{sent && <div className="space-y-2"><Label htmlFor="response-sent-at">Invitation sent · local time</Label><Input id="response-sent-at" type="datetime-local" value={sentAt} onChange={event => setSentAt(event.target.value)} />{validSent && <p className="text-sm text-muted-foreground">Response deadline: {new Date(calculateDue(new Date(sentAt).toISOString(), {days:10})).toLocaleString()}</p>}<p className="text-xs text-muted-foreground">An existing response deadline will not be replaced.</p></div>}</div>}
        {(pending === 'In Progress' || pending === 'Awaiting Response') && <p className="text-sm text-muted-foreground">A Regulatory Relations email will be sent after confirmation to the respondent, copying the complainant, assigned investigator and MB/DMB, provided all email addresses are present. {pending === 'Awaiting Response' ? 'The 10-calendar-day response deadline starts after Gmail accepts the invitation; an existing deadline is retained.' : 'This status email does not start a response deadline.'}</p>}
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => setPending(null)}>Cancel</Button><Button disabled={mutation.isPending || (startPrehearing && sent && !validSent)} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Updating…' : 'Confirm stage change'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}