import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, FolderOpen, CalendarDays, CheckCircle2, Archive, FileText, MessageSquare, Gavel } from "lucide-react";
import { disputesQuery, STAGES, stageStyles } from "@/lib/hub";
import { portalHead } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { Badge } from "@/components/ui/badge";
import { responsesQuery, appealsQuery } from '@/lib/intake';
import { submissionTypeCounts } from '@/lib/submission-metrics';

export const Route = createFileRoute("/_authenticated/metrics")({
  head: () => portalHead("Metrics & Reporting", "Submission types, case volume, stages and jurisdiction for authorized portal matters."),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(disputesQuery),context.queryClient.ensureQueryData(responsesQuery),context.queryClient.ensureQueryData(appealsQuery)]),
  component: Metrics,
});

function Metrics() {
  const { data: cases } = useSuspenseQuery(disputesQuery);
  const { data: responses } = useSuspenseQuery(responsesQuery);
  const { data: appeals } = useSuspenseQuery(appealsQuery);
  const submissions = submissionTypeCounts(cases,responses,appeals);
  const submissionIcons = { hearing_request: FileText, response: MessageSquare, appeal: Gavel };
  const active = cases.filter(c => !c.archived_at);
  const jurisdictions = [...new Set(active.map(c => c.state || "Not specified"))].sort();
  const stats = [
    { label: "Cases on record", value: cases.length, icon: BarChart3 },
    { label: "Open matters", value: active.filter(c => c.stage !== "Closed").length, icon: FolderOpen },
    { label: "Hearings scheduled", value: active.filter(c => c.stage === "Hearing Scheduled").length, icon: CalendarDays },
    { label: "Closed matters", value: active.filter(c => c.stage === "Closed").length, icon: CheckCircle2 },
    { label: "Archived matters", value: cases.filter(c => c.archived_at).length, icon: Archive },
  ];
  return <div className="space-y-8">
    <WorkspaceHeading eyebrow="Reporting" title="Metrics & Reporting" detail="Authorized case records · current totals" />
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">{stats.map(s => <article key={s.label} className="rounded-lg border border-border bg-card p-5"><s.icon className="size-5 text-primary" /><p className="mt-4 text-3xl font-semibold tabular-nums">{s.value}</p><p className="mt-1 text-sm text-muted-foreground">{s.label}</p></article>)}</div>
    <section aria-labelledby="submission-types"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 id="submission-types" className="text-xl font-semibold">Submission types</h2><span className="text-sm text-muted-foreground">{submissions.reduce((total,row)=>total+row.count,0)} total submissions</span></div><div className="grid gap-4 sm:grid-cols-3">{submissions.map(row => { const Icon = submissionIcons[row.type as keyof typeof submissionIcons]; return <article key={row.type} className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><Icon className="size-5 text-primary" /><span className="text-xs text-muted-foreground">{row.participant}</span></div><p className="mt-4 text-3xl font-semibold tabular-nums">{row.count}</p><h3 className="mt-1 text-sm font-medium">{row.label}</h3></article>; })}</div></section>
    <section><h2 className="mb-4 text-xl font-semibold">Case stages</h2><p className="mb-4 text-xs text-muted-foreground">Non-archived matters</p><div className="divide-y border-y">{STAGES.map(stage => <div key={stage} className="flex items-center justify-between py-4"><Badge variant="outline" className={stageStyles[stage]}>{stage}</Badge><span className="text-lg font-semibold tabular-nums">{active.filter(c => c.stage === stage).length}</span></div>)}</div></section>
    <section><h2 className="mb-4 text-xl font-semibold">Jurisdiction breakdown</h2>{jurisdictions.length === 0 ? <p className="py-8 text-sm text-muted-foreground">No case records yet.</p> : <div className="divide-y border-y">{jurisdictions.map(state => <div key={state} className="flex items-center justify-between py-4 text-sm"><span>{state}</span><span className="font-semibold tabular-nums">{active.filter(c => (c.state || "Not specified") === state).length}</span></div>)}</div>}</section>
  </div>;
}