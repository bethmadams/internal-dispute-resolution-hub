import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { monthlySubmissions, type SubmissionRecord } from '@/lib/submission-metrics';

const series = [
  { key: 'hearing_request', name: 'Requests', color: 'var(--chart-1)' },
  { key: 'response', name: 'Responses', color: 'var(--chart-2)' },
  { key: 'appeal', name: 'Appeals', color: 'var(--chart-4)' },
];

export function SubmissionCharts({ rows }: { rows: SubmissionRecord[] }) {
  const monthly = monthlySubmissions(rows);
  const comparison = series.map(item => ({ name: item.name, count: rows.filter(row => row.type === item.key).length }));
  return <div className="grid min-w-0 gap-6 lg:grid-cols-2">
    <div className="min-w-0"><h3 className="mb-4 font-semibold">Monthly filing trend</h3>
      {monthly.length === 0 ? <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No dated submissions in this period.</div> : <div className="h-72 w-full" role="img" aria-label="Monthly filing trend for requests, responses and appeals">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={monthly} margin={{ top: 12, right: 20, left: 0, bottom: 4 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={value => new Date(`${value}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })} />
          <YAxis allowDecimals={false} stroke="var(--muted-foreground)" width={32} />
          <Tooltip content={<ReportTooltip />} /><Legend />
          {series.map(item => <Line key={item.key} dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />)}
        </LineChart></ResponsiveContainer>
      </div>}
    </div>
    <div className="min-w-0"><h3 className="mb-4 font-semibold">Submission volume by type</h3>
      {rows.length === 0 ? <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No submissions in this period.</div> : <div className="h-72 w-full" role="img" aria-label="Submission volume comparison by type">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ top: 12, right: 20, left: 0, bottom: 4 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" width={32} />
          <Tooltip content={<ReportTooltip />} /><Bar dataKey="count" name="Submissions" fill="var(--chart-3)" maxBarSize={64} isAnimationActive={false} />
        </BarChart></ResponsiveContainer>
      </div>}
    </div>
  </div>;
}

function ReportTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number | string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-md border border-border bg-popover p-3 text-sm text-popover-foreground shadow-md"><p className="mb-1 font-medium">{label}</p>{payload.map((row, index) => <p key={index}>{row.name}: <span className="font-semibold tabular-nums">{row.value}</span></p>)}</div>;
}