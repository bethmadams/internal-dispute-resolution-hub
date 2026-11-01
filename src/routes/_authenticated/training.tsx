import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, PlayCircle, FolderOpen } from "lucide-react";
import { resourcesQuery } from "@/lib/hub";
import { TRAINING_RESOURCES, portalHead } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => portalHead("Training View", "Training library and hearing-room preparation materials for the eXp dispute resolution process."),
  loader: ({ context }) => context.queryClient.ensureQueryData(resourcesQuery),
  component: Training,
});
function Training() {
  const { data: resources } = useSuspenseQuery(resourcesQuery);
  const items = [...TRAINING_RESOURCES, ...resources.filter(r => r.category?.toLowerCase() === "training").map(r => ({ title: r.title, kind: "Training resource", url: r.url }))];
  return <div className="space-y-8"><WorkspaceHeading eyebrow="Learning" title="Training View" detail="Internal dispute resolution · hearing preparation" />
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.title} className="flex flex-col rounded-lg border border-border bg-card p-6"><div className="mb-6 flex h-24 items-center justify-center rounded-md bg-primary/5 text-primary">{item.kind === "Video" ? <PlayCircle className="size-12" /> : <FolderOpen className="size-12" />}</div><p className="rule-label">{item.kind}</p><h2 className="mt-2 flex-1 text-lg font-semibold">{item.title}</h2>{item.url && <Button variant="outline" className="mt-6 self-start" asChild><a href={item.url} target="_blank" rel="noreferrer">{item.kind === "Video" ? "Open video" : "Open library"}<ExternalLink className="size-4" /></a></Button>}</article>)}</div>
  </div>;
}