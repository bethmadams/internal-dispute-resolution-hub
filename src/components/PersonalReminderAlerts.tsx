import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { remindersQuery } from "@/lib/reminders";
import { disputesQuery } from "@/lib/hub";
import { dispatchReminderHub } from "@/lib/reminder-hub.functions";
import { isHubReminderDue } from "@/lib/hub-notify";
import { useMyRole } from "@/hooks/use-role";

export function PersonalReminderAlerts() {
  const { user } = useCurrentUser(); const router = useRouter(); const client = useQueryClient();
  const { isStaff } = useMyRole();
  const dispatchHub = useServerFn(dispatchReminderHub);
  const hubBusy = useRef(false);
  const { data: reminders = [] } = useQuery(remindersQuery);
  const { data: cases = [] } = useQuery(disputesQuery);
  useEffect(() => {
    if (!isStaff || !user || hubBusy.current) return;
    const due = reminders.filter(r => (r.user_id === user.id || r.created_by === user.id) && isHubReminderDue(r));
    if (!due.length) return;
    hubBusy.current = true;
    void (async () => {
      try {
        for (const r of due) {
          try { await dispatchHub({ data: { id: r.id } }); }
          catch { /* Keep the bell independent; retry pending delivery on the next refresh. */ }
        }
      } finally { hubBusy.current = false; }
    })();
  }, [reminders, user, isStaff, dispatchHub]);
  useEffect(() => {
    const refresh = () => { void client.invalidateQueries({ queryKey: ["personal_reminders"] }); };
    window.addEventListener("focus", refresh);
    const channel = supabase.channel(`personal-reminders-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "personal_reminders" }, refresh).subscribe();
    return () => { window.removeEventListener("focus", refresh); void supabase.removeChannel(channel); };
  }, [client]);
  useEffect(() => {
    let stopped = false;
    async function check() {
      for (const r of reminders.filter(r => r.user_id === user?.id && !r.done && !r.notified_at && Date.parse(r.remind_at) <= Date.now())) {
        const { data: claimed, error } = await supabase.rpc("claim_due_reminder", { _id: r.id });
        if (claimed && !error && !stopped) toast(cases.find(c => c.id === r.dispute_id)?.title ?? "Matter reminder", { description: r.body, duration: 15000, action: { label: "Open", onClick: () => void router.navigate({ to: "/cases/$caseId", params: { caseId: r.dispute_id } }) } });
      }
    }
    void check(); return () => { stopped = true; };
  }, [reminders, user?.id, cases, router]);
  return null;
}