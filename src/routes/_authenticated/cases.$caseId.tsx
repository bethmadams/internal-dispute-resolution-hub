import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { attachmentsQuery, downloadAttachment } from "@/lib/intake";

export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case File | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Full case file: parties, stage history, hearing schedule, investigator notes and resolution record.",
      },
      { property: "og:title", content: "Case File | Internal Dispute Resolution Hub" },
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
  const { data: attachments = [] } = useQuery(attachmentsQuery(caseId));

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
    <div className="space-y-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Case board
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="rule-label">{dispute.case_number}</p>
          <h1 className="mt-1 max-w-2xl text-3xl font-semibold">{dispute.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={stageStyles[dispute.stage]}>
              {dispute.stage}
            </Badge>
            <Badge variant="outline" className={priorityStyles[dispute.priority]}>
              {dispute.priority} priority
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="panel p-6">
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
          </section>

          <section className="panel p-6">
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
            <dl className="mt-5 space-y-5">
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
            <h3 className="mt-8 text-sm font-semibold">Attachments</h3>
            <ul className="mt-3 space-y-2">
              {attachments.length === 0 && (
                <li className="text-sm text-muted-foreground">No files attached.</li>
              )}
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  <button
                    className="text-primary hover:underline"
                    onClick={async () => {
                      try {
                        window.open(await downloadAttachment(a.file_path), "_blank");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    {a.file_name}
                  </button>
                  <span className="rule-label">
                    {a.kind === "binding_agreement" ? "Binding agreement" : "Supporting"}
                  </span>
                </li>
              ))}
            </ul>
          </section>


          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Resolution</h2>
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
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Case notes</h2>
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
          </section>
        </div>

        <aside className="panel h-fit space-y-5 p-6">
          <h2 className="text-lg font-semibold">Case controls</h2>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={dispute.stage}
              onValueChange={(v) => patch.mutate({ stage: v as Stage })}
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
        </aside>
      </div>
    </div>
  );
}
