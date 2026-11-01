import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { filterSubmissionDates, monthlySubmissions, type SubmissionRecord } from '@/lib/submission-metrics';
import { SubmissionCharts } from '@/components/SubmissionCharts';

function displayDate(date: string, monthly = false) {
  if (!date) return 'Not recorded';
  return new Date(`${date}${monthly ? '-01' : ''}T00:00:00Z`).toLocaleDateString('en-US', monthly
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function SubmissionDatesReport({ rows }: { rows: SubmissionRecord[] }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const invalid = Boolean(from && to && from > to);
  const filtered = invalid ? [] : filterSubmissionDates(rows, from, to);
  const months = monthlySubmissions(filtered);
  return <section aria-labelledby="submission-dates" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id="submission-dates" className="text-xl font-semibold">Submissions over time</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">Filed from<Input type="date" aria-label="Filed from" value={from} onChange={event => setFrom(event.target.value)} /></label>
        <label className="space-y-1 text-sm">Filed through<Input type="date" aria-label="Filed through" value={to} onChange={event => setTo(event.target.value)} /></label>
        <Button variant="outline" size="icon" title="Clear date filters" aria-label="Clear date filters" onClick={() => { setFrom(''); setTo(''); }}><RotateCcw className="size-4" /></Button>
      </div>
    </div>
    {invalid && <p role="alert" className="text-sm text-destructive">The end date must be on or after the start date.</p>}
    <SubmissionCharts rows={filtered} />
    <Table><TableHeader><TableRow><TableHead>Filing month</TableHead><TableHead className="text-right">Requests</TableHead><TableHead className="text-right">Responses</TableHead><TableHead className="text-right">Appeals</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
      <TableBody>{months.map(row => <TableRow key={row.month}><TableCell className="font-medium">{displayDate(row.month, true)}</TableCell><TableCell className="text-right tabular-nums">{row.hearing_request}</TableCell><TableCell className="text-right tabular-nums">{row.response}</TableCell><TableCell className="text-right tabular-nums">{row.appeal}</TableCell><TableCell className="text-right font-semibold tabular-nums">{row.total}</TableCell></TableRow>)}{months.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No dated submissions in this period.</TableCell></TableRow>}</TableBody>
    </Table>
    <div className="flex items-baseline justify-between gap-3 pt-3"><h3 className="font-semibold">Filing history</h3><span className="text-sm text-muted-foreground">{filtered.length} submissions</span></div>
    <div className="max-h-96 overflow-auto"><Table><TableHeader><TableRow><TableHead>Filed on</TableHead><TableHead>Submission type</TableHead><TableHead>Submitted by</TableHead><TableHead>Matter</TableHead></TableRow></TableHeader><TableBody>
      {filtered.map(row => <TableRow key={`${row.type}-${row.id}`}><TableCell className="whitespace-nowrap">{displayDate(row.date)}</TableCell><TableCell>{row.label}</TableCell><TableCell className="min-w-36 whitespace-normal break-words">{row.name}</TableCell><TableCell className="min-w-40 whitespace-normal break-words">{row.caseName}</TableCell></TableRow>)}
      {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No submissions in this period.</TableCell></TableRow>}
    </TableBody></Table></div>
  </section>;
}