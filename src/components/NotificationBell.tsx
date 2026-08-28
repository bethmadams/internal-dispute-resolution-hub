import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentUser } from "@/hooks/use-session";
import { useMyRole } from "@/hooks/use-role";
import { formatDateTime, notificationsQuery, notificationReadsQuery } from "@/lib/hub";

export function NotificationBell() {
  const { user } = useCurrentUser();
  const { isStaff } = useMyRole();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    ...notificationsQuery,
    enabled: isStaff,
    refetchInterval: 60_000,
  });
  const { data: reads = [] } = useQuery({
    ...notificationReadsQuery,
    enabled: isStaff && Boolean(user),
  });

  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, queryClient]);

  if (!isStaff) return null;

  const readIds = new Set(reads.map((r) => r.notification_id));
  const unread = notifications.filter((n) => !readIds.has(n.id));

  const markAllRead = async () => {
    if (!user || unread.length === 0) return;
    const rows = unread.map((n) => ({ notification_id: n.id, user_id: user.id }));
    await supabase.from("notification_reads").upsert(rows, {
      onConflict: "notification_id,user_id",
      ignoreDuplicates: true,
    });
    queryClient.invalidateQueries({ queryKey: ["notification_reads"] });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread.length > 0 ? `${unread.length} new notifications` : "Notifications"
          }
          className="relative text-ink-foreground/70 hover:bg-sidebar-accent hover:text-ink-foreground"
        >
          <Bell className="size-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-[1.15rem] items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-[1.15rem] font-semibold text-destructive-foreground">
              {unread.length > 99 ? "99+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Activity</p>
          <p className="text-xs text-muted-foreground">
            {unread.length > 0 ? `${unread.length} new` : "All caught up"}
          </p>
        </div>
        <ul className="max-h-96 divide-y overflow-y-auto">
          {notifications.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">No activity yet.</li>
          )}
          {notifications.map((n) => {
            const isUnread = !readIds.has(n.id);
            const row = (
              <div className={isUnread ? "bg-destructive/5" : undefined}>
                <div className="flex items-start gap-2 px-4 py-3">
                  {isUnread && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      {[n.case_number, n.state].filter(Boolean).join(" · ")}
                      {(n.case_number || n.state) && " · "}
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.dispute_id ? (
                  <Link
                    to="/cases/$caseId"
                    params={{ caseId: n.dispute_id }}
                    onClick={() => setOpen(false)}
                    className="block hover:bg-muted/60"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
