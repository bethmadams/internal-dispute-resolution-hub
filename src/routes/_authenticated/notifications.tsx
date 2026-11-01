import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Bell, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole } from "@/hooks/use-role";
import { useCurrentUser } from "@/hooks/use-session";
import { notificationsQuery, notificationReadsQuery, formatDateTime } from "@/lib/hub";
import { portalHead } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({ head: () => portalHead("My Notifications", "Recent case activity and unread notifications for authorized portal staff."), component: Notifications });
function Notifications() {
  const { isStaff } = useMyRole(); const { user } = useCurrentUser(); const client = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications = [], isPending, error } = useQuery({ ...notificationsQuery, enabled: isStaff, refetchInterval: 60000 });
  const { data: reads = [] } = useQuery({ ...notificationReadsQuery, enabled: isStaff });
  const readIds = new Set(reads.map(r => r.notification_id)); const unread = notifications.filter(n => !readIds.has(n.id));
  const markRead = useMutation({ mutationFn: async (ids: string[]) => { if (!user) throw new Error("Not signed in"); const { error } = await supabase.from("notification_reads").upsert(ids.map(id => ({ notification_id: id, user_id: user.id })), { onConflict: "notification_id,user_id", ignoreDuplicates: true }); if (error) throw error; }, onSuccess: () => client.invalidateQueries({ queryKey: ["notification_reads"] }), onError: (e: Error) => toast.error(e.message) });
  const visible = unreadOnly ? unread : notifications;
  return <div className="space-y-6"><WorkspaceHeading eyebrow="Activity" title="My Notifications" detail={isStaff ? `${unread.length} unread · most recent 50 notifications` : "Staff activity feed"}>{isStaff && <Button variant="outline" disabled={!unread.length || markRead.isPending} onClick={() => markRead.mutate(unread.map(n => n.id))}><CheckCheck className="size-4" />Mark all read</Button>}</WorkspaceHeading>
    {!isStaff ? <p className="text-sm text-muted-foreground">Case activity notifications are available to administrators and investigators.</p> : <><div className="flex gap-2"><Button variant={!unreadOnly ? "default" : "outline"} onClick={() => setUnreadOnly(false)}>All</Button><Button variant={unreadOnly ? "default" : "outline"} onClick={() => setUnreadOnly(true)}>Unread</Button></div>
    {error ? <p className="text-destructive">Unable to load notifications.</p> : isPending ? <p className="text-muted-foreground">Loading activity…</p> : !visible.length ? <div className="py-16 text-center"><Bell className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">{unreadOnly ? "You’re all caught up." : "No notifications yet."}</p></div> : <ul className="divide-y border-y">{visible.map(n => <li key={n.id} className={`flex items-start gap-4 px-3 py-5 ${!readIds.has(n.id) ? "bg-primary/5" : ""}`}><Bell className={`mt-1 size-4 shrink-0 ${!readIds.has(n.id) ? "text-destructive" : "text-muted-foreground"}`} /><div className="min-w-0 flex-1"><p className="font-medium">{n.title}</p>{n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}<p className="mt-2 text-xs text-muted-foreground">{[n.case_number, n.state, formatDateTime(n.created_at)].filter(Boolean).join(" · ")}</p>{n.dispute_id && <Button variant="link" size="sm" className="mt-2 px-0" asChild><Link to="/cases/$caseId" params={{ caseId: n.dispute_id }} onClick={() => { if (!readIds.has(n.id)) markRead.mutate([n.id]); }}>View matter<ArrowUpRight className="size-4" /></Link></Button>}</div></li>)}</ul>}</>}
  </div>;
}