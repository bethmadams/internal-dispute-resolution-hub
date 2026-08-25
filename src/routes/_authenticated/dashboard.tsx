import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  disputesQuery,
  formatDate,
  nextCaseNumber,
  PRIORITIES,
  priorityStyles,
  profilesQuery,
  STAGES,
  stageStyles,
  type Priority,
  type Stage,
} from "@/lib/hub";
import { appealsQuery, responsesQuery } from "@/lib/intake";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Case Board | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Track every internal dispute by stage, priority and assigned investigator on the IDR case board.",
      },
      { property: "og:title", content: "Case Board | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content: "Live view of internal disputes across submission, hearing, appeal and closure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { data: disputes = [], isLoading } = useQuery(disputesQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: responses = [] } = useQuery(responsesQuery);
  const { data: appeals = [] } = useQuery(appealsQuery);
  const linkResponse = useMutation({
    mutationFn: async ({ id, disputeId }: { id: string; disputeId: string | null }) => {
      const { error } = await supabase
        .from("dispute_responses")
        .update({ dispute_id: disputeId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response linked");
      queryClient.invalidateQueries({ queryKey: ["dispute_responses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const linkAppeal = useMutation({
    mutationFn: async ({ id, disputeId }: { id: string; disputeId: string | null }) => {
      const { error } = await supabase
        .from("dispute_appeals")
        .update({ dispute_id: disputeId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appeal linked");
      queryClient.invalidateQueries({ queryKey: ["dispute_appeals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    filed_by: "",
    respondent: "",
    department: "",
    stage: "New Submission" as Stage,
    priority: "Medium" as Priority,
    filed_at: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const counts = useMemo(
    () =>
      STAGES.map((stage) => ({
        stage,
        count: disputes.filter((d) => d.stage === stage).length,
      })),
    [disputes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return disputes.filter((d) => {
      const matchesStage = stageFilter === "all" || d.stage === stageFilter;
      const matchesQuery =
        !q ||
        [d.case_number, d.title, d.filed_by, d.respondent, d.department]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q));
      return matchesStage && matchesQuery;
    });
  }, [disputes, search, stageFilter]);

  const createCase = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("disputes").insert({
        case_number: nextCaseNumber(disputes),
        title: form.title,
        description: form.description || null,
        filed_by: form.filed_by || null,
        respondent: form.respondent || null,
        department: form.department || null,
        stage: form.stage,
        priority: form.priority,
        filed_at: form.filed_at,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Case logged");
      setOpen(false);
      setForm({ ...form, title: "", filed_by: "", respondent: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameFor = (id: string | null) =>
    (id && profiles.find((p) => p.id === id)?.full_name) ||
    (id && profiles.find((p) => p.id === id)?.email) ||
    "Unassigned";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rule-label">Case board</p>
          <h1 className="mt-1 text-3xl font-semibold">Active disputes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {disputes.length} case{disputes.length === 1 ? "" : "s"} on record
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Log a dispute
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Log a new dispute</DialogTitle>
              <DialogDescription>
                A case number is assigned automatically ({nextCaseNumber(disputes)}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Case title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="filed_by">Filed by</Label>
                  <Input
                    id="filed_by"
                    value={form.filed_by}
                    onChange={(e) => setForm({ ...form, filed_by: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respondent">Respondent</Label>
                  <Input
                    id="respondent"
                    value={form.respondent}
                    onChange={(e) => setForm({ ...form, respondent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filed_at">Date filed</Label>
                  <Input
                    id="filed_at"
                    type="date"
                    value={form.filed_at}
                    onChange={(e) => setForm({ ...form, filed_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm({ ...form, stage: v as Stage })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Summary</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createCase.mutate()}
                disabled={!form.title.trim() || createCase.isPending}
              >
                {createCase.isPending ? "Saving…" : "Log case"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="rule-label">Public submission forms</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share these links with agents — submissions land in New Submission.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PUBLIC_FORMS.map((f) => (
            <div key={f.to} className="rounded-md border border-border p-4">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.who}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={f.to}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ExternalLink className="size-3.5" /> Open form
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto px-3 py-1.5 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${f.to}`);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copy link
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>


      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map(({ stage, count }) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
            className={`panel p-4 text-left transition-shadow hover:shadow-lift ${
              stageFilter === stage ? "ring-2 ring-ring" : ""
            }`}
          >
            <p className="rule-label">{stage}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{count}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search case number, party, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-sm text-muted-foreground">Loading cases…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">
            No cases match. Log a dispute to get started.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => (
              <li key={d.id}>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: d.id }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-secondary/60"
                >
                  <span className="font-display text-xs font-semibold text-muted-foreground">
                    {d.case_number}
                  </span>
                  <span className="min-w-40 flex-1 text-sm font-medium">{d.title}</span>
                  <Badge variant="outline" className={stageStyles[d.stage]}>
                    {d.stage}
                  </Badge>
                  <Badge variant="outline" className={priorityStyles[d.priority]}>
                    {d.priority}
                  </Badge>
                  <span className="w-40 truncate text-xs text-muted-foreground">
                    {nameFor(d.assigned_to)}
                  </span>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {formatDate(d.filed_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="space-y-4">
        <div>
          <p className="rule-label">Respondent submissions</p>
          <h2 className="mt-1 text-xl font-semibold">Hearing response forms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Responses arrive unmatched — link each one to the case it answers.
          </p>
        </div>
        <div className="panel overflow-hidden">
          {responses.length === 0 ? (
            <p className="p-8 text-sm text-muted-foreground">No responses submitted yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {responses.map((r) => (
                <li key={r.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-sm font-medium">{r.responder_name}</span>
                    {r.state && (
                      <span className="text-xs text-muted-foreground">{r.state}</span>
                    )}
                    {r.responding_to_name && (
                      <span className="text-xs text-muted-foreground">
                        responding to {r.responding_to_name}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(r.submitted_on)}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                    {r.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={r.dispute_id ?? "unlinked"}
                      onValueChange={(v) =>
                        linkResponse.mutate({ id: r.id, disputeId: v === "unlinked" ? null : v })
                      }
                    >
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlinked">Not linked to a case</SelectItem>
                        {disputes.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.case_number} — {d.filed_by ?? d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {r.dispute_id && (
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: r.dispute_id }}
                        className="text-sm text-primary hover:underline"
                      >
                        Open case
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="rule-label">Appeal submissions</p>
          <h2 className="mt-1 text-xl font-semibold">Appeal requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Appeals arrive unmatched — link each one to the case it appeals, then move that case to
            Appeal Filed.
          </p>
        </div>
        <div className="panel overflow-hidden">
          {appeals.length === 0 ? (
            <p className="p-8 text-sm text-muted-foreground">No appeal requests submitted yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {appeals.map((a) => (
                <li key={a.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-sm font-medium">{a.appellant_name}</span>
                    <span className="text-xs text-muted-foreground">{a.appellant_role}</span>
                    {a.state && <span className="text-xs text-muted-foreground">{a.state}</span>}
                    {a.hearing_date && (
                      <span className="text-xs text-muted-foreground">
                        hearing {formatDate(a.hearing_date)}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(a.submitted_on)}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {a.new_evidence}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={a.dispute_id ?? "unlinked"}
                      onValueChange={(v) =>
                        linkAppeal.mutate({ id: a.id, disputeId: v === "unlinked" ? null : v })
                      }
                    >
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlinked">Not linked to a case</SelectItem>
                        {disputes.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.case_number} — {d.filed_by ?? d.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {a.dispute_id && (
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: a.dispute_id }}
                        className="text-sm text-primary hover:underline"
                      >
                        Open case
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}


