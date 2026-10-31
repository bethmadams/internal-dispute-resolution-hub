import { createClient } from "@supabase/supabase-js";
import { copyRow, submissionTables, type SubmissionType } from "./submission-copy";

export function externalClient(key: string) {
  return createClient("https://gmfromhyruezaswwrqov.supabase.co", key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers, signal: AbortSignal.timeout(15000) });
    } },
  });
}

export async function flushCopies(key: string, id?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin.from("submission_copy_queue").select("*").is("copied_at", null).order("created_at").limit(50);
  if (id) query = query.eq("id", id);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load pending copies.");
  const client = externalClient(key);
  for (const row of data ?? []) {
    const table = submissionTables[row.form_type as SubmissionType];
    if (!table || !row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) continue;
    const result = await client.from(table).upsert(copyRow(row.id, row.payload as Record<string, unknown>, row.created_at), { onConflict: "id" });
    if (result.error) throw new Error("External submission tables are unavailable. Records remain safely queued in the portal.");
    const marked = await supabaseAdmin.from("submission_copy_queue").update({ copied_at: new Date().toISOString() }).eq("id", row.id);
    if (marked.error) throw new Error("Unable to confirm the submission copy.");
  }
}