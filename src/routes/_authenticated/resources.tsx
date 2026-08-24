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
          "Policies, intake templates, hearing guidelines and closure checklists for the internal dispute resolution process.",
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rule-label">Reference library</p>
          <h1 className="mt-1 text-3xl font-semibold">Resolution resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Policies, templates and guidelines supporting the IDR process.
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
    </div>
  );
}
