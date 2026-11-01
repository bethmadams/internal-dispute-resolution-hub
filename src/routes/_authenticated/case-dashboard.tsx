import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, CalendarClock, FolderOpen, Search, UserRound, RefreshCw } from 'lucide-react';
import { getCaseProgress } from '@/lib/case-progress.functions';
import { caseDeadlines } from '@/lib/case-progress';
import { caseTitle } from '@/lib/case-rules';
import { deadlineState } from '@/lib/sop-rules';
import { formatDateTime, STAGES, stageStyles } from '@/lib/hub';
import { portalHead } from '@/lib/portal-library';
import { WorkspaceHeading } from '@/components/WorkspaceHeading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const progressQuery = queryOptions({ queryKey: ['case-progress'], queryFn: () => getCaseProgress(), staleTime: 0 });

export const Route = createFileRoute('/_authenticated/case-dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === 'string' ? search['q'] : '',
    stage: STAGES.some(stage => stage === search['stage']) ? String(search['stage']) : 'all',
    assigned: typeof search['assigned'] === 'string' ? search['assigned'] : 'all',
    deadlines: search['deadlines'] === 'overdue' || search['deadlines'] === 'soon' ? search['deadlines'] : 'all',
    archive: search['archive'] === true || search['archive'] === 'true',
  }),
  head: () => portalHead('Case Dashboard', 'Current case stages, assigned investigators, checklist progress and recorded deadlines for authorized dispute matters.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(progressQuery),
  errorComponent: () => <DashboardError />,
  notFoundComponent: () => <p>No case dashboard found.</p>,
  component: CaseDashboard,
});

function DashboardError() {
  const router = useRouter();
  return <div role="alert" className="space-y-4"><h1 className="text-2xl font-semibold">Unable to load case progress</h1><Button variant="outline" onClick={() => router.invalidate()}><RefreshCw className="size-4" />Try again</Button></div>;
}

function CaseDashboard() {
  const { data, isFetching, refetch } = useSuspenseQuery({ ...progressQuery, refetchInterval: 60000 });
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (values: Partial<typeof search>) => navigate({ search: previous => ({ ...previous, ...values }), replace: true });
  const nameFor = (id: string | null) => data.profiles.find(profile => profile.id === id)?.full_name || data.profiles.find(profile => profile.id === id)?.email || 'Unassigned';
  const matters = data.cases.filter(matter => Boolean(matter.archived_at) === search.archive).map(matter => {
    const tasks = data.tasks.filter(task => task.dispute_id === matter.id);
    const deadlines = caseDeadlines(matter.id, matter.hearing_date, data.tasks, data.workflows.find(workflow => workflow.dispute_id === matter.id));
    // A past hearing remains in the case record, but is not an unfinished task.
    const pending = deadlines.filter(deadline => deadline.id !== 'hearing' || Date.parse(deadline.dueAt) >= Date.now());
    return { ...matter, name: caseTitle(matter.filed_by, matter.respondent, matter.title), tasks, deadlines: pending,
      overdue: pending.some(deadline => deadlineState(deadline.dueAt, null) === 'Overdue'),
      soon: pending.some(deadline => deadlineState(deadline.dueAt, null) === 'Due soon') };
  });
  const visible = matters.filter(matter =>
    (search.stage === 'all' || matter.stage === search.stage) &&
    (search.assigned === 'all' || (search.assigned === 'unassigned' ? !matter.assigned_to : matter.assigned_to === search.assigned)) &&
    (search.deadlines === 'all' || (search.deadlines === 'overdue' ? matter.overdue : matter.soon)) &&
    [matter.name, matter.case_number, matter.state, nameFor(matter.assigned_to)].some(value => value?.toLowerCase().includes(search.q.trim().toLowerCase()))
  );
  const assignedIds = [...new Set(matters.flatMap(matter => matter.assigned_to ? [matter.assigned_to] : []))];
  const stats = [
    { label: 'Open cases', value: matters.filter(matter => matter.stage !== 'Closed').length, icon: FolderOpen, tone: 'text-primary' },
    { label: 'Cases with overdue dates', value: matters.filter(matter => matter.overdue).length, icon: AlertCircle, tone: 'text-destructive' },
    { label: 'Due within 48 hours', value: matters.filter(matter => matter.soon).length, icon: CalendarClock, tone: 'text-stage-hearing' },
    { label: 'Unassigned cases', value: matters.filter(matter => !matter.assigned_to && matter.stage !== 'Closed').length, icon: UserRound, tone: 'text-muted-foreground' },
  ];

  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><WorkspaceHeading eyebrow="Case progress" title="Case Dashboard" detail={`${matters.length} ${search.archive ? 'archived' : 'current'} cases`} /><Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}><RefreshCw className="size-4" />Refresh</Button></div>
    <section aria-label="Case totals" className="grid grid-cols-2 gap-6 border-y border-border py-6 xl:grid-cols-4">{stats.map(stat => <div key={stat.label}><div className={`mb-3 flex items-center gap-2 ${stat.tone}`}><stat.icon className="size-5" /><span className="text-3xl font-semibold tabular-nums">{stat.value}</span></div><p className="text-sm text-muted-foreground">{stat.label}</p></div>)}</section>
    <section aria-label="Case filters" className="space-y-3">
      <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search cases" placeholder="Search case, state or investigator…" className="pl-9" value={search.q} onChange={event => update({ q: event.target.value })} /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select value={search.stage} onValueChange={stage => update({ stage })}><SelectTrigger aria-label="Filter by stage" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem>{STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
        <Select value={search.assigned} onValueChange={assigned => update({ assigned })}><SelectTrigger aria-label="Filter by investigator" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All investigators</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem>{assignedIds.map(id => <SelectItem key={id} value={id}>{nameFor(id)}</SelectItem>)}</SelectContent></Select>
        <Select value={search.deadlines} onValueChange={value => update({ deadlines: value === 'overdue' || value === 'soon' ? value : 'all' })}><SelectTrigger aria-label="Filter by deadline" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All deadlines</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="soon">Due within 48 hours</SelectItem></SelectContent></Select>
        <Select value={search.archive ? 'archived' : 'current'} onValueChange={value => update({ archive: value === 'archived' })}><SelectTrigger aria-label="Filter by archive" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="current">Current cases</SelectItem><SelectItem value="archived">Archived cases</SelectItem></SelectContent></Select>
      </div>
    </section>
    <section aria-label="Case progress list">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Case progress</h2><span className="text-sm text-muted-foreground">{visible.length} cases</span></div>
      <div className="hidden grid-cols-[1.3fr_1fr_1.5fr] gap-6 border-b border-border pb-3 text-xs font-semibold uppercase text-muted-foreground lg:grid"><span>Matter & stage</span><span>Assigned investigator</span><span>Deadlines & checklist</span></div>
      {visible.length === 0 ? <p className="border-y border-border py-12 text-sm text-muted-foreground">No cases match these filters.</p> : <div className="divide-y divide-border">{visible.map(matter => {
        const completed = matter.tasks.filter(task => task.completed_at).length;
        return <article key={matter.id} className="grid gap-5 py-6 lg:grid-cols-[1.3fr_1fr_1.5fr] lg:gap-6">
          <div className="min-w-0"><Link to="/cases/$caseId" params={{ caseId: matter.id }} className="inline-flex max-w-full items-start gap-2 font-semibold text-primary hover:underline"><span className="break-words">{matter.name}</span><ArrowUpRight className="mt-0.5 size-4 shrink-0" /></Link><p className="mt-1 text-xs text-muted-foreground">{matter.state || 'State not specified'} · {matter.case_number}</p><Badge variant="outline" className={`mt-3 ${stageStyles[matter.stage]}`}>{matter.stage}</Badge><p className="mt-3 text-xs text-muted-foreground">Updated {formatDateTime(matter.updated_at)}</p></div>
          <div className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="text-sm font-medium break-words">{nameFor(matter.assigned_to)}</p><p className="mt-1 text-xs text-muted-foreground">Investigator</p></div></div>
          <div className="min-w-0 space-y-3">{matter.deadlines.length === 0 ? <p className="text-sm text-muted-foreground">{data.isStaff ? 'No pending deadlines recorded' : 'No upcoming hearing scheduled'}</p> : <><DeadlineList deadlines={matter.deadlines.slice(0, 2)} nameFor={nameFor} />{matter.deadlines.length > 2 && <details><summary className="cursor-pointer text-xs font-medium text-primary">{matter.deadlines.length - 2} more dates</summary><div className="mt-3"><DeadlineList deadlines={matter.deadlines.slice(2)} nameFor={nameFor} /></div></details>}</>}{data.isStaff && <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">{matter.tasks.length ? `${completed} of ${matter.tasks.length} checklist tasks complete` : 'Checklist not initialized'}</p>{matter.tasks.length > 0 && <progress aria-label={`${matter.name} checklist completion`} max={matter.tasks.length} value={completed} className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" />}</div>}</div>
        </article>;
      })}</div>}
    </section>
  </div>;
}

function DeadlineList({ deadlines, nameFor }: { deadlines: ReturnType<typeof caseDeadlines>; nameFor: (id: string | null) => string }) {
  return <ul className="space-y-3">{deadlines.map(deadline => {
    const status = deadlineState(deadline.dueAt, null);
    return <li key={deadline.id}><p className="text-sm font-medium">{deadline.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(deadline.dueAt)} <span className={status === 'Overdue' ? 'font-semibold text-destructive' : status === 'Due soon' ? 'font-semibold text-stage-hearing' : ''}>· {status}</span></p>{deadline.assigneeId && <p className="mt-1 text-xs text-muted-foreground">Task owner: {nameFor(deadline.assigneeId)}</p>}</li>;
  })}</ul>;
}