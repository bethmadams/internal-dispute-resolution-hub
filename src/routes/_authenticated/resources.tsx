import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
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
import { resourcesQuery } from "@/lib/hub";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resolution Resources | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Policies, SOP, checklists, intake templates, hearing guidelines and closure materials for the internal dispute resolution process.",
      },
      { property: "og:title", content: "Resolution Resources | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content: "The reference library behind the internal dispute resolution process.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Resources,
});

const PAGES = [
  {
    title: "Internal Dispute SOP",
    url: "https://docs.google.com/document/d/1RQntasVV_wc52iDF6r1Ekd2xeztKJJxU80s57uY6ixE/edit?tab=t.0",
    notes: [
      "This Internal Dispute Hearing SOP is intended to assist staff and panelists in making the process accessible to all agents. The ideal goal is to create a welcoming professional environment free of intimidation and bias. Each step in the proceedings should be smooth and transparent enabling trust and integrity to be evident to all those who participate.",
    ],
  },
  {
    title: "Submission Guidelines",
    url: "https://docs.google.com/document/d/1hPGtOKhnPEFi3sTrDRQ_ZlYK5-QIaInfYMknznMT__8/edit?tab=t.0",
    notes: [
      "Before any matters are submitted to Internal Dispute Resolution, the DMB/MB must exhaust other efforts through in-state mediation to resolve the matter. To avoid any confusion, the Internal Dispute Resolution should be considered a last resort, not an early intervention option.",
      "Before the Internal Dispute Resolution process is deployed, the DMB/MB must discuss the matter with the Regional Director to ensure other internal avenues have been used to resolve the matter.",
      "Prior to submitting a matter, during the Mediation process, the DMB/MB must inform both disputing parties that the Internal Dispute Resolution is absolutely voluntary and the parties are NOT obligated to participate.",
    ],
    lists: [
      {
        heading: "What is submittable",
        items: [
          "Commission disputes between two active agents licensed within the eXp Realty brokerages (eXp Realty, eXp Commercial and eXp Referral) only",
          "NAR Code of Ethics violations",
          "Commercial real estate ethics violations",
          "Arbitration",
        ],
      },
      {
        heading: "What is not permissible",
        items: [
          "Agents who are no longer licensed with eXp",
          "Employees of eXp are not permitted to participate",
          "Team agreements and mentor/mentee relationships",
          "Matters relating to a transaction will not be heard during an active pending transaction",
        ],
      },
    ],
  },
];

const LIBRARY: { title: string; kind: string; url: string }[] = [
  {
    title: "Pre-Hearing Checklist",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1dAHZmJDnNgUx2mWQ3KDtlZF25f81SOX5",
  },
  {
    title: "Hearing Panel Checklist",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1y9BYrsQ17CzayvsuTsVkJ6xGuguDekPm",
  },
  {
    title: "Post Hearing Checklist",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1WpyRdJJ3uVoPZWsRgNW6WwwUuRackxz4",
  },
  {
    title: "Appeal Checklist",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/15db7M25p7WYQ0t3bTVYQh5tqztMvqEGi",
  },
  {
    title: "eXp Citation Policy Folder",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1VhAC9tkZAe8WLqTtdqWOFH8MAr93QTov",
  },
  {
    title: "Internal Dispute Panelists Jon App",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1D_xXUUCT3nlJqCawBhEI9Y-FL2ya-mC4",
  },
  {
    title: "Internal Dispute Panelists",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/1qFMkIrM02vx6U4sKdZJruT9QwHGWrLQk",
  },
  {
    title: "Training",
    kind: "Drive folder",
    url: "https://drive.google.com/drive/folders/19l3-YuUro0T8DC40qGaDckGZ4Vcq2s5b",
  },
  {
    title: "Training to set up and lock the room",
    kind: "Video",
    url: "https://drive.google.com/file/d/1zhkP_8bdVL0g0KNV-DvN9HJpbrzMLSu6/view",
  },
  {
    title: "Training to set up and lock the room (2)",
    kind: "Video",
    url: "https://drive.google.com/file/d/1fRYdDSY3kwocyj_WXq4F-jHNrogDTEEe/view",
  },
  {
    title: "In-State Mediation",
    kind: "Google Doc",
    url: "https://docs.google.com/document/d/1Iei_eEglCWtgGyKf904Ky2KU2wlth_X1oim4m7ZGfJE/edit?tab=t.0",
  },
];

function Resources() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { data: resources = [] } = useQuery(resourcesQuery);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", url: "", description: "" });

  const categories = useMemo(
    () => Array.from(new Set(resources.map((r) => r.category).filter(Boolean))) as string[],
    [resources],
  );
  const [active, setActive] = useState<string>("all");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("resources").insert({
        title: form.title,
        category: form.category || null,
        url: form.url || null,
        description: form.description || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource added");
      setOpen(false);
      setForm({ title: "", category: "", url: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = active === "all" ? resources : resources.filter((r) => r.category === active);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rule-label">Reference library</p>
          <h1 className="mt-1 text-3xl font-semibold">Resolution resources</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Policies, templates, operating procedure and checklists supporting the IDR process.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add resource
          </Button>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add a resource</DialogTitle>
              <DialogDescription>
                Link a policy, template or guideline for the panel to reference.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r-title">Title</Label>
                <Input
                  id="r-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="r-cat">Category</Label>
                  <Input
                    id="r-cat"
                    placeholder="Policy, Template, Guideline…"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-url">Link (optional)</Label>
                  <Input
                    id="r-url"
                    placeholder="https://"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-desc">Description</Label>
                <Textarea
                  id="r-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!form.title.trim() || create.isPending}
              >
                {create.isPending ? "Saving…" : "Add resource"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active === c
                  ? "border-transparent bg-ink text-ink-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((r) => (
          <article key={r.id} className="panel flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{r.title}</h2>
              {r.category && (
                <Badge variant="outline" className="shrink-0">
                  {r.category}
                </Badge>
              )}
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {r.description || "No description provided."}
            </p>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open resource <ExternalLink className="size-3.5" />
              </a>
            )}
          </article>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No resources in this category yet.</p>
        )}
      </div>

      <section className="space-y-6">
        <div>
          <p className="rule-label">Admin personnel</p>
          <h2 className="mt-1 text-2xl font-semibold">Operating procedure</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Operating procedure and intake criteria for staff administering the internal dispute
            resolution process.
          </p>
        </div>
        <div className="space-y-6">
          {PAGES.map((page) => (
            <article key={page.title} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl font-semibold">{page.title}</h3>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open document <ExternalLink className="size-3.5" />
                </a>
              </div>
              <div className="mt-4 space-y-3">
                {page.notes.map((n) => (
                  <p key={n.slice(0, 24)} className="text-sm leading-relaxed text-muted-foreground">
                    {n}
                  </p>
                ))}
              </div>
              {page.lists && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {page.lists.map((list) => (
                    <div key={list.heading}>
                      <p className="rule-label">{list.heading}</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {list.items.map((i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-accent">•</span>
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="rule-label">Drive library</p>
          <h2 className="mt-1 text-2xl font-semibold">Checklists, policy and training</h2>
        </div>
        <div className="space-y-4">
          {LIBRARY.map((item) => (
            <article
              key={item.url}
              className="panel flex flex-wrap items-center justify-between gap-3 p-6"
            >
              <div>
                <p className="rule-label">{item.kind}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open <ExternalLink className="size-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
