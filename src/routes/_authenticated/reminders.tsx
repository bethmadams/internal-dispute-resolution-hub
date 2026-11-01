import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ArrowUpRight } from "lucide-react";
import { useMyRole } from "@/hooks/use-role";
import { useCurrentUser } from "@/hooks/use-session";
import { tasksQuery } from "@/lib/sop-data";
import { deadlineState } from "@/lib/sop-rules";
import { disputesQuery, formatDateTime } from "@/lib/hub";
import { portalHead } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/reminders")({ head: () => portalHead("My Reminders", "Assigned case tasks, confirmed deadlines and overdue reminders for portal staff."), component: Reminders });
function Reminders() {
  const { isStaff } = useMyRole(); const { user } = useCurrentUser(); const [scope, setScope] = useState("mine");
  const { data: tasks = [], isPending, error } = useQuery({ ...tasksQuery(), enabled: isStaff, refetchInterval: 60000 });
  const { data: cases = [] } = useQuery({ ...disputesQuery, enabled: isStaff });
  const pending = tasks.filter(t => !t.completed_at && (scope === "all" || t.assignee_id === user?.id)).sort((a, b) => (a.due_at ? Date.parse(a.due_at) : Infinity) - (b.due_at ? Date.parse(b.due_at) : Infinity));
  const urgent = pending.filter(t => ["Due soon", "Overdue"].includes(deadlineState(t.due_at, t.completed_at)));
  return <div className="space-y-6"><WorkspaceHeading eyebrow="Deadlines" title="My Reminders" detail={isStaff ? `${pending.length} pending tasks · ${urgent.length} need attention` : "Case task deadlines"} />
    {!isStaff ? <p className="text-sm text-muted-foreground">Operational reminders are available to administrators and investigators.</p> : <><div className="flex flex-wrap gap-2"><Button variant={scope === "mine" ? "default" : "outline"} onClick={() => setScope("mine")}>Assigned to me</Button><Button variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>All case tasks</Button></div>
    {error ? <p className="text-destructive">Unable to load reminders.</p> : isPending ? <p className="text-muted-foreground">Loading reminders…</p> : !pending.length ? <div className="py-16 text-center"><CalendarClock className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No pending tasks{scope === "mine" ? " assigned to you" : ""}.</p></div> : <ul className="divide-y border-y">{pending.map(t => { const status = deadlineState(t.due_at, t.completed_at); const matter = cases.find(c => c.id === t.dispute_id); return <li key={t.id} className="flex flex-wrap items-start justify-between gap-4 py-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{t.title}</h2><Badge variant="outline" className={status === "Overdue" ? "border-destructive/30 text-destructive" : status === "Due soon" ? "border-stage-hearing/30 text-stage-hearing" : "text-muted-foreground"}>{status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{matter?.case_number || "Case task"} · {t.phase} · {formatDateTime(t.due_at)}</p>{t.evidence_note && <p className="mt-2 text-sm text-muted-foreground">{t.evidence_note}</p>}</div><Button variant="outline" size="sm" asChild><Link to="/cases/$caseId" params={{ caseId: t.dispute_id }}>Open case<ArrowUpRight className="size-4" /></Link></Button></li>; })}</ul>}</>}
  </div>;
}