import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CaseDocuments } from "@/components/CaseDocuments";
import { CaseAccess } from "@/components/CaseAccess";
import { useMyRole } from "@/hooks/use-role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDate,
  formatDateTime,
  PRIORITIES,
  priorityStyles,
  profilesQuery,
  STAGES,
  stageStyles,
  type Dispute,
  type DisputeNote,
  type Priority,
  type Stage,
} from "@/lib/hub";
import { responsesQuery } from "@/lib/intake";
import { caseTitle } from "@/lib/case-rules";
import { DeleteCard } from "@/components/DeleteCard";
import { CaseTasks } from "@/components/CaseTasks";
import { CasePanel } from "@/components/CasePanel";
import { CaseWorkflow, ReleasedDecision } from "@/components/CaseWorkflow";
import { CaseCommunications } from "@/components/CaseCommunications";
import { CaseOperations } from "@/components/CaseOperations";
import { PersonalReminders } from "@/components/PersonalReminders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseStageChange } from "@/components/CaseStageChange";
import { CaseStageEmails } from "@/components/CaseStageEmails";

const CASE_TABS = ['overview', 'submission', 'responses', 'documents', 'reminders', 'checklist', 'workflow', 'panel', 'communications', 'history', 'access', 'resolution', 'notes'] as const;


export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  validateSearch: (search: Record<string, unknown>): { tab?: (typeof CASE_TABS)[number] } => { const tab = CASE_TABS.find(tab => tab === search['tab']); return tab ? { tab } : {}; },
  head: () => ({
    meta: [
      { title: "Case File | eXp Internal Dispute Resolution Portal" },
      {
        name: "description",
        content:
          "Full case file: parties, stage history, hearing schedule, investigator notes and resolution record.",
      },
      { property: "og:title", content: "Case File | eXp Internal Dispute Resolution Portal" },
      {
        property: "og:description",
        content: "Parties, stage, hearing date, notes and resolution for a single internal dispute.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { isStaff } = useMyRole();
  const { tab = 'overview' } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: dispute, isLoading } = useQuery({
    queryKey: ["dispute", caseId],
    queryFn: async (): Promise<Dispute | null> => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();
      if (error) throw error;
      return data as Dispute | null;
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["dispute_notes", caseId],
    queryFn: async (): Promise<DisputeNote[]> => {
      const { data, error } = await supabase
        .from("dispute_notes")
        .select("*")
        .eq("dispute_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DisputeNote[];
    },
  });

  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: allResponses = [] } = useQuery(responsesQuery);
  const responses = allResponses.filter((response) => response.dispute_id === caseId);
  

  useEffect(() => {
    if (dispute) setResolution(dispute.resolution ?? "");
  }, [dispute]);

  const patch = useMutation({
    mutationFn: async (values: Partial<Dispute>) => {
      const { error } = await supabase.from("disputes").update(values).eq("id", caseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute", caseId] });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["case_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["case-progress"] });
      toast.success("Case updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("dispute_notes")
        .insert({ dispute_id: caseId, author_id: user.id, body: note.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["dispute_notes", caseId] });
      toast.success("Note added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const authorName = (id: string | null) => {
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "Unknown";
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading case…</p>;
  if (!dispute) return <p className="text-sm text-muted-foreground">Case not found.</p>;

  return (
    <div className="case-file space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Case board
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="rule-label">{dispute.case_number}</p>
          <h1 className="mt-1 max-w-2xl text-3xl font-semibold">{caseTitle(dispute.filed_by, dispute.respondent, dispute.title)}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={stageStyles[dispute.stage]}>
              {dispute.stage}
            </Badge>
            <Badge variant="outline" className={priorityStyles[dispute.priority]}>
              {dispute.priority} priority
            </Badge>
          </div>
        </div>
        <DeleteCard table="disputes" id={caseId} label={`${dispute.case_number} — ${caseTitle(dispute.filed_by, dispute.respondent, dispute.title)}`} returnToBoard />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Tabs value={!isStaff && ['checklist','workflow','panel','communications','history','access'].includes(tab) ? 'overview' : tab} onValueChange={value => { const next = CASE_TABS.find(item => item === value); if(next) navigate({ search: { tab: next }, replace: true }); }} className="min-w-0">
          <TabsList aria-label="Case sections" className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-surface p-1">
            {CASE_TABS.filter(item => isStaff || !['checklist','workflow','panel','communications','history','access'].includes(item)).map(item => <TabsTrigger key={item} value={item}>{({overview:'Overview',submission:'Submission',responses:'Responses',documents:'Documents',reminders:'Reminders',checklist:'Checklist',workflow:'Workflow',panel:'Panel',communications:'Communications',history:'History & exports',access:'Case access',resolution:'Resolution',notes:'Notes'})[item]}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="overview"><section className="py-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Summary</h2>
              {dispute.source === "public_form" && (
                <Badge variant="outline">Submitted via hearing request form</Badge>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {dispute.description || "No summary recorded."}
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Complainant", dispute.filed_by || "—"],
                ["Complainant email", dispute.complainant_email || "—"],
                ["MB/DMB name", dispute.mb_dmb_name || "—"],
                ["MB/DMB email", dispute.mb_dmb_email || "—"],
                ["Respondent", dispute.respondent || "—"],
                ["Respondent email", dispute.respondent_email || "—"],
                ["Respondent phone", dispute.respondent_phone || "—"],
                [
                  "Respondent active with eXp",
                  dispute.respondent_active === null ? "—" : dispute.respondent_active ? "Yes" : "No",
                ],
                ["State", dispute.state || "—"],
                ["Department", dispute.department || "—"],
                ["Date filed", formatDate(dispute.filed_at)],
                ["Hearing", formatDateTime(dispute.hearing_date)],
                ["Last updated", formatDateTime(dispute.updated_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="rule-label">{label}</dt>
                  <dd className="mt-1 text-sm break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section></TabsContent>

          <TabsContent value="submission"><section className="py-6">
            <h2 className="text-lg font-semibold">Submission details</h2>
            {dispute.reasons?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {dispute.reasons.map((r) => (
                  <Badge key={r} variant="outline">
                    {r}
                  </Badge>
                ))}
              </div>
            )}
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                ["Code of Ethics articles cited", dispute.ethics_articles],
                ["What the complainant is seeking", dispute.seeking],
                ["Steps taken to remedy", dispute.steps_taken],
                ["Property address", dispute.property_address],
                [
                  "Closing date",
                  dispute.closing_date ? formatDate(dispute.closing_date) : null,
                ],
                [
                  "Monetary amount involved",
                  dispute.involves_money
                    ? dispute.monetary_amount
                      ? `$${dispute.monetary_amount.toLocaleString()}`
                      : "Yes — amount not stated"
                    : dispute.involves_money === false
                      ? "No"
                      : null,
                ],
                ["Additional comments", dispute.additional_comments],
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="rule-label">{label}</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">{value}</dd>
                  </div>
                ))}
            </dl>
          </section></TabsContent>

          <TabsContent value="responses"><section className="py-6">
            <h2 className="text-lg font-semibold">Hearing responses</h2>
            {responses.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No responses received for this case.</p>}
            <ul className="mt-4 space-y-5">
              {responses.map((response) => (
                <li key={response.id} className="border-l-2 border-accent pl-4">
                  <h3 className="font-medium">{response.responder_name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Respondent · {formatDate(response.submitted_on)} · {response.state ?? "—"}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{response.summary}</p>
                  {response.additional_comments && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{response.additional_comments}</p>}
                </li>
              ))}
            </ul>
          </section></TabsContent>

          <TabsContent value="documents"><CaseDocuments caseId={caseId} /></TabsContent>
          <TabsContent value="reminders"><PersonalReminders caseId={caseId} /></TabsContent>

          {isStaff && <><TabsContent value="checklist"><CaseTasks caseId={caseId}/></TabsContent><TabsContent value="workflow"><CaseWorkflow caseId={caseId}/></TabsContent><TabsContent value="panel"><CasePanel caseId={caseId} state={dispute.state}/></TabsContent><TabsContent value="communications"><CaseStageEmails dispute={dispute}/><CaseCommunications caseId={caseId}/></TabsContent><TabsContent value="history"><CaseOperations dispute={dispute}/></TabsContent></>}

          {isStaff && <TabsContent value="access"><CaseAccess caseId={caseId} isClosed={dispute.stage === "Closed"} /></TabsContent>}



          <TabsContent value="resolution">{!isStaff && <ReleasedDecision caseId={caseId}/>}<section className="py-6">
            <h2 className="text-lg font-semibold">Resolution</h2>
            {isStaff ? (
              <>
                <Textarea
                  className="mt-3"
                  rows={4}
                  placeholder="Record the outcome, remedies and closure notes…"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => patch.mutate({ resolution: resolution || null })}
                  disabled={patch.isPending}
                >
                  Save resolution
                </Button>
              </>
            ) : (
              <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
                {dispute.resolution || "No resolution recorded."}
              </p>
            )}
          </section></TabsContent>

          <TabsContent value="notes"><section className="py-6">
            <h2 className="text-lg font-semibold">Case notes</h2>
            {isStaff && (
            <div className="mt-3 space-y-3">
              <Textarea
                rows={3}
                placeholder="Add an update to the case timeline…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button onClick={() => addNote.mutate()} disabled={!note.trim() || addNote.isPending}>
                Add note
              </Button>
            </div>
            )}
            <ul className="mt-6 space-y-4">
              {notes.length === 0 && (
                <li className="text-sm text-muted-foreground">No notes yet.</li>
              )}
              {notes.map((n) => (
                <li key={n.id} className="border-l-2 border-accent pl-4">
                  <p className="text-xs text-muted-foreground">
                    {authorName(n.author_id)} · {formatDateTime(n.created_at)}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          </section></TabsContent>
        </Tabs>

        <aside className="case-controls h-fit space-y-5 border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Case controls</h2>
          {!isStaff && (
            <p className="text-sm text-muted-foreground">
              You have read-only access to this case.
            </p>
          )}
          {isStaff && (
          <>
          <CaseStageChange dispute={dispute} />
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={dispute.priority}
              onValueChange={(v) => patch.mutate({ priority: v as Priority })}
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
          <div className="space-y-2">
            <Label>Assigned to</Label>
            <Select
              value={dispute.assigned_to ?? "unassigned"}
              onValueChange={(v) => patch.mutate({ assigned_to: v === "unassigned" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hearing">Hearing date</Label>
            <Input
              id="hearing"
              type="datetime-local"
              value={dispute.hearing_date ? dispute.hearing_date.slice(0, 16) : ""}
              onChange={(e) =>
                patch.mutate({
                  hearing_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>
          <Button variant="outline" onClick={()=>patch.mutate({archived_at:dispute.archived_at?null:new Date().toISOString()})}>{dispute.archived_at?'Restore from archive':'Archive case'}</Button>
          </>
          )}
        </aside>
      </div>
    </div>
  );
}
