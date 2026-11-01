import { createFileRoute } from "@tanstack/react-router";
import { Bell, CalendarDays } from "lucide-react";
import { portalHead } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { PersonalReminders } from "@/components/PersonalReminders";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/reminders")({ head: () => portalHead("My Reminders", "Personal matter reminders, due dates and reminders assigned to you or by you in the eXp dispute portal."), component: Reminders });
function Reminders() {
  return <div className="space-y-7"><WorkspaceHeading eyebrow="Across all matters" title="My Reminders" />
    <div className="divide-y rounded-md border bg-card px-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="flex items-center gap-4"><span className="rounded-md bg-sidebar p-3 text-sidebar-accent-foreground"><CalendarDays className="size-5" /></span><h2 className="text-base font-semibold">Google Calendar</h2></div><Badge variant="outline">Not connected</Badge></div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="flex items-center gap-4"><span className="rounded-md bg-sidebar p-3 text-sidebar-accent-foreground"><Bell className="size-5" /></span><h2 className="text-base font-semibold">Notifications</h2></div><div className="flex flex-wrap items-center gap-4"><span className="flex items-center gap-2 text-sm"><span className="size-3 rounded-full bg-primary" />Hub</span><span className="text-sm text-muted-foreground">Email</span><Badge variant="outline">Unavailable</Badge></div></div>
    </div><PersonalReminders />
  </div>;
}