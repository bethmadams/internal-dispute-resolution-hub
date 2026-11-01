import { useQuery } from '@tanstack/react-query';
import { Circle, CircleDot, History, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { caseTimeline } from '@/lib/case-timeline';
import { formatDateTime, type Dispute } from '@/lib/hub';
import type { Audit } from '@/lib/sop-data';

export function CaseTimeline({ dispute }: { dispute: Dispute }) {
  const history = useQuery({
    queryKey: ['case_audit', dispute.id, 'stage-timeline'],
    queryFn: async () => {
      const rows: Audit[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('case_audit').select('*').eq('dispute_id', dispute.id).eq('record_type', 'disputes').eq('action', 'UPDATE').order('created_at').order('id').range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) return rows;
      }
    },
  });
  const timeline = caseTimeline(dispute.stage, history.data ?? []);
  return <section className="space-y-5 py-6" aria-labelledby="case-timeline-title">
    <div className="flex items-center justify-between gap-3"><h2 id="case-timeline-title" className="text-lg font-semibold">Case timeline</h2><Button variant="outline" size="icon" aria-label="Refresh case timeline" title="Refresh case timeline" onClick={() => history.refetch()} disabled={history.isFetching}><RefreshCw className="size-4" /></Button></div>
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm"><p>Current stage: <span className="font-semibold">{dispute.stage}</span></p><p className="text-muted-foreground">Case created: {formatDateTime(dispute.created_at)}</p></div>
    {history.isPending ? <p className="text-sm text-muted-foreground">Loading recorded stage history…</p> : history.isError ? <p role="alert" className="text-sm text-destructive">Stage history could not be loaded. Please refresh the timeline.</p> : <>
      <ol className="divide-y divide-border">{timeline.stages.map(row => {
        const Icon = row.status === 'Current' ? CircleDot : row.status === 'Previously visited' ? History : Circle;
        return <li key={row.stage} className="grid gap-2 py-4 sm:grid-cols-[1fr_1fr]">
          <div className="flex items-start gap-3"><Icon className={`mt-0.5 size-5 shrink-0 ${row.status === 'Current' ? 'text-primary' : 'text-muted-foreground'}`} /><div><h3 className="text-sm font-semibold">{row.stage}</h3><Badge variant={row.status === 'Current' ? 'default' : 'outline'} className="mt-1">{row.status}</Badge></div></div>
          <dl className="pl-8 text-xs sm:pl-0"><div className="flex flex-wrap gap-x-2"><dt className="text-muted-foreground">Latest entry:</dt><dd>{row.enteredAt ? formatDateTime(row.enteredAt) : 'Not recorded'}</dd></div>{row.exitedAt && <div className="mt-1 flex flex-wrap gap-x-2"><dt className="text-muted-foreground">Latest exit:</dt><dd>{formatDateTime(row.exitedAt)}</dd></div>}{row.visits > 1 && <p className="mt-1 text-muted-foreground">{row.visits} recorded entries</p>}</dl>
        </li>;
      })}</ol>
      <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-semibold">Recorded stage changes ({timeline.transitions.length})</summary><ol className="mt-3 divide-y divide-border">{[...timeline.transitions].reverse().map(event => <li key={event.id} className="py-3 text-sm"><p className="font-medium">{event.from} → {event.to}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.at)}</p></li>)}</ol>{timeline.transitions.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No stage changes recorded.</p>}</details>
    </>}
  </section>;
}