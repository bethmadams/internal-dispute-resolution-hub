import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { remindersQuery } from "@/lib/reminders";
import { disputesQuery } from "@/lib/hub";

export function PersonalReminderAlerts() {
  const { user } = useCurrentUser(); const router = useRouter(); const client = useQueryClient();
  const { data: reminders = [] } = useQuery(remindersQuery);
  const { data: cases = [] } = useQuery(disputesQuery);
  useEffect(() => {
    const refresh = () => { void client.invalidateQueries({ queryKey: ["personal_reminders"] }); };
    window.addEventListener("focus", refresh);
    // Polling is authoritative; this same-origin event refreshes local mutations immediately.
    return () => window.removeEventListener("focus", refresh);
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