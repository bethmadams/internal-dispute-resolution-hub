import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildHubMessage, hubPortalOrigin, isHubSubmission } from "./hub-notify";

// Delivers one portal notification to the eXp Hub "Internal Dispute
// Resolution Notification" channel, tagging the territory investigator.
// Staff-only; each notification is claimed once via public.hub_deliveries.
export const dispatchHubNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { notificationId: string }) => input)
  .handler(async ({ data, context }) => {
    const key = process.env["HUB_API_KEY"];
    if (!key) throw new Error("Hub notifications are not configured.");

    const { data: isStaff } = await context.supabase.rpc("is_staff", {
      _user_id: context.userId,
    });
    if (!isStaff) throw new Error("Forbidden");

    const { data: notice, error: noticeError } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("id", data.notificationId)
      .single();
    if (noticeError || !notice) throw new Error("Notification not found");
    // Bell-only events must never reach Hub, including previously queued updates.
    if (!isHubSubmission(notice.kind)) return { delivered: false, reason: "bell_only" };

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Claim the delivery; ignoreDuplicates means an existing row (any
    // status) belongs to another dispatcher run.
    const { data: claim } = await supabaseAdmin
      .from("hub_deliveries")
      .upsert(
        { notification_id: notice.id, status: "pending" },
        { onConflict: "notification_id", ignoreDuplicates: true },
      )
      .select("id");
    if (!claim || claim.length === 0) {
      return { delivered: false, reason: "already_claimed" };
    }

    const finish = async (
      status: "sent" | "failed" | "skipped",
      hubStatus: number | null,
      error: string | null,
    ) => {
      await supabaseAdmin
        .from("hub_deliveries")
        .update({
          status,
          hub_status: hubStatus,
          error,
          updated_at: new Date().toISOString(),
        })
        .eq("notification_id", notice.id);
      return { delivered: status === "sent", status, error };
    };

    // Resolve the case for territory routing, its name and the link.
    let caseUrl: string | null = null;
    let caseName: string | null = null;
    let state = notice.state as string | null;
    if (notice.dispute_id) {
      const { data: dispute } = await context.supabase
        .from("disputes")
        .select("id, state, title")
        .eq("id", notice.dispute_id)
        .single();
      if (dispute) {
        state = state ?? (dispute.state as string | null);
        caseName = (dispute.title as string | null) ?? null;
        const origin = hubPortalOrigin(getRequestUrl());
        caseUrl = `${origin}/cases/${dispute.id}`;
      }
    }

    // Territory investigator for the dispute state.
    let investigatorName: string | null = null;
    let mention = null;
    if (state) {
      const { data: territory } = await supabaseAdmin
        .from("territory_assignments")
        .select("investigator_name, investigator_email")
        .eq("state", state)
        .maybeSingle();
      if (territory?.investigator_email) {
        investigatorName = territory.investigator_name as string;
        const { searchHubUser } = await import("./hub-notify.server");
        mention = await searchHubUser(territory.investigator_email, key);
      }
    }

    const message = buildHubMessage({
      kind: notice.kind as string,
      title: notice.title as string,
      state,
      caseName,
      caseUrl,
      investigatorName,
      mention,
    });

    const { sendHubMessage } = await import("./hub-notify.server");
    const result = await sendHubMessage(key, message);
    if (result.ok) return finish("sent", result.status, null);
    // 429 stays claimable later; everything else is recorded as failed.
    if (result.status === 429) {
      await supabaseAdmin
        .from("hub_deliveries")
        .delete()
        .eq("notification_id", notice.id);
      return { delivered: false, reason: "rate_limited" };
    }
    return finish("failed", result.status, result.error ?? "send failed");
  });
