import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { HUB_CONVERSATION_ID, hubPortalOrigin } from "@/lib/hub-notify";
import { searchHubUser, sendHubMessage } from "@/lib/hub-notify.server";

export const dispatchReminderHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase.from("personal_reminders").select("*").eq("id", data.id).maybeSingle();
    if (error || !r || (r.created_by !== context.userId && r.user_id !== context.userId)) return { status: "unavailable" };
    // Personal reminder text must not leak into the shared staff Hub channel.
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) return { status: "staff_only" };
    const key = process.env["HUB_API_KEY"];
    if (!key) return { status: "not_configured" };
    const { data: matter } = await context.supabase.from("disputes").select("title,case_number").eq("id", r.dispute_id).maybeSingle();
    if (!matter) return { status: "unavailable" };
    const mention = await searchHubUser(r.user_email, key);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin.from("reminder_hub_deliveries").update({ status: "claimed", claimed_at: new Date().toISOString() }).eq("reminder_id", r.id).eq("status", "pending").select("reminder_id").maybeSingle();
    if (!claim) return { status: "already_claimed" };
    const due = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(new Date(r.due_at));
    const request = getRequest();
    const requestUrl = new URL(request.url);
    const origin = hubPortalOrigin(requestUrl);
    const content = ["Internal Dispute Resolution Notification", "New reminder", `${matter.case_number} · ${matter.title}`, `Assigned to: ${mention ? `@${mention.username}` : r.user_email}`, `Created by: ${r.created_by_email}`, `Due: ${due} (America/Chicago)`, r.body, `View the matter: ${origin}/cases/${r.dispute_id}`].join("\n");
    const result = await sendHubMessage(key, { conversation_id: HUB_CONVERSATION_ID, content, ...(mention ? { mentions: [mention] } : {}) });
    const status = result.ok ? "sent" : result.status === 0 ? "uncertain" : result.status === 429 ? "pending" : "failed";
    await supabaseAdmin.from("reminder_hub_deliveries").update({ status, sent_at: result.ok ? new Date().toISOString() : null, error: result.error ?? null }).eq("reminder_id", r.id);
    return { status };
  });