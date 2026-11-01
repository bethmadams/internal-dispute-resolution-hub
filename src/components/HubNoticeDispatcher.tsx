import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery } from "@/lib/hub";
import { dispatchHubNotification } from "@/lib/hub-notify.functions";

const INITIAL_DELAY_MS = 2500;
const POLL_INTERVAL_MS = 20000;
const MAX_PER_CYCLE = 5;

// Watches for portal notifications that have not yet been delivered to the
// eXp Hub channel and dispatches them. Notifications RLS is staff-only, so
// this no-ops for non-staff users. The red bell is unaffected.
export function HubNoticeDispatcher() {
  const dispatch = useServerFn(dispatchHubNotification);
  const busy = useRef(false);

  const { data: notifications } = useQuery(notificationsQuery);
  const { data: deliveries, refetch: refetchDeliveries } = useQuery({
    queryKey: ["hub_deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hub_deliveries")
        .select("notification_id");
      if (error) return [];
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!notifications || !deliveries) return;
    const delivered = new Set(deliveries.map((d) => d.notification_id));
    const pending = notifications
      .filter((n) => !delivered.has(n.id))
      .slice(0, MAX_PER_CYCLE);
    if (pending.length === 0 || busy.current) return;

    busy.current = true;
    (async () => {
      for (const n of pending) {
        try {
          await dispatch({ data: { notificationId: n.id } });
        } catch {
          // Delivery failures are recorded in hub_deliveries; keep going.
        }
      }
      busy.current = false;
      refetchDeliveries();
    })();
  }, [notifications, deliveries, dispatch, refetchDeliveries]);

  // Gentle polling so deliveries continue while a staff page is open.
  useEffect(() => {
    const start = window.setTimeout(() => {
      const timer = window.setInterval(() => {
        refetchDeliveries();
      }, POLL_INTERVAL_MS);
      return () => window.clearInterval(timer);
    }, INITIAL_DELAY_MS);
    return () => window.clearTimeout(start);
  }, [refetchDeliveries]);

  return null;
}
