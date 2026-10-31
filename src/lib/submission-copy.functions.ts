import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canReadSubmissionCopies, submissionTables } from "./submission-copy";
import { externalClient, flushCopies } from "./submission-copy.server";

// Public callers can only request delivery of an already-persisted queue row.
// No submitted payload, destination, or case data is accepted or returned.
export const deliverSubmissionCopy = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env['EXTERNAL_SUBMISSIONS_SECRET_KEY'];
    if (!key) return { copied: false };
    try { await flushCopies(key, data.id); return { copied: true }; }
    catch { return { copied: false }; }
  });

export const readSubmissionCopies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ type: z.enum(['hearing_request', 'hearing_response', 'appeal']) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (error || !canReadSubmissionCopies((roles ?? []).map((r) => r.role))) throw new Error("Only admins and investigators can view submissions.");
    const key = process.env['EXTERNAL_SUBMISSIONS_SECRET_KEY'];
    if (!key) throw new Error("External submission connection is not configured.");
    let warning: string | null = null;
    try { await flushCopies(key); } catch { warning = "Some external copies are pending. Original submissions remain available on the Case Board."; }
    const result = await externalClient(key).from(submissionTables[data.type]).select("id,submitted_by,state,submitted_on,summary").order("created_at", { ascending: false }).limit(200);
    if (result.error) throw new Error("External submission tables are not ready. Original submissions remain available on the Case Board.");
    return { rows: (result.data ?? []) as { id: string; submitted_by: string | null; state: string | null; submitted_on: string | null; summary: string | null }[], warning };
  });