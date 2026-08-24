import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "dispute-files";

export const DISPUTE_REASONS = [
  "Commission dispute",
  "REALTOR Code of Ethics complaint",
  "Referral agreement dispute",
  "Team/downline dispute",
  "Client or listing procuring cause",
  "Professional conduct concern",
  "Other",
] as const;

export const BINDING_AGREEMENT_NOTE =
  "Complete, sign and attach the eXp Internal Dispute Resolution Hearing Binding Agreement Form as part of your documentation.";

export const REGULATORY_EMAIL = "RegulatoryRelations@exprealty.net";

export type DisputeResponseRow = {
  id: string;
  dispute_id: string | null;
  responder_name: string;
  responder_email: string | null;
  submitted_on: string;
  state: string | null;
  responding_to_name: string | null;
  summary: string;
  additional_comments: string | null;
  created_at: string;
};

export type Attachment = {
  id: string;
  dispute_id: string | null;
  response_id: string | null;
  kind: string;
  file_path: string;
  file_name: string;
  created_at: string;
};

export const responsesQuery = {
  queryKey: ["dispute_responses"],
  queryFn: async (): Promise<DisputeResponseRow[]> => {
    const { data, error } = await supabase
      .from("dispute_responses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DisputeResponseRow[];
  },
};

export function attachmentsQuery(disputeId: string) {
  return {
    queryKey: ["dispute_attachments", disputeId],
    queryFn: async (): Promise<Attachment[]> => {
      const { data, error } = await supabase
        .from("dispute_attachments")
        .select("*")
        .eq("dispute_id", disputeId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Attachment[];
    },
  };
}

export async function downloadAttachment(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

const MAX_BYTES = 20 * 1024 * 1024;

export async function uploadIntakeFiles(
  folder: string,
  files: File[],
): Promise<{ file_path: string; file_name: string }[]> {
  const out: { file_path: string; file_name: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 20MB.`);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    out.push({ file_path: path, file_name: file.name });
  }
  return out;
}

export const hearingRequestSchema = z.object({
  submitted_by: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  state: z.string().trim().min(2, "State is required").max(60),
  other_agent: z.string().trim().min(2, "Name of the other agent is required").max(120),
  other_agent_email: z.string().trim().email("Enter a valid email for the other agent").max(255),
  other_agent_phone: z.string().trim().max(40).optional().or(z.literal("")),
  other_agent_active: z.enum(["yes", "no"]),
  reasons: z.array(z.string()).min(1, "Select at least one reason"),
  ethics_articles: z.string().trim().max(500).optional().or(z.literal("")),
  summary: z.string().trim().min(20, "Please describe the facts of the issue").max(6000),
  seeking: z.string().trim().min(5, "Tell us what you are seeking").max(2000),
  steps_taken: z.string().trim().min(5, "Describe the steps taken so far").max(2000),
  property_address: z.string().trim().max(300).optional().or(z.literal("")),
  closing_date: z.string().optional().or(z.literal("")),
  involves_money: z.enum(["yes", "no"]),
  monetary_amount: z.string().trim().max(30).optional().or(z.literal("")),
  additional_comments: z.string().trim().max(2000).optional().or(z.literal("")),
  submission_date: z.string().min(1, "Submission date is required"),
});

export const responseFormSchema = z.object({
  submitted_by: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255).optional().or(z.literal("")),
  submission_date: z.string().min(1, "Submission date is required"),
  state: z.string().trim().min(2, "State is required").max(60),
  responding_to: z.string().trim().max(120).optional().or(z.literal("")),
  summary: z.string().trim().min(20, "Please summarise your response").max(6000),
  additional_comments: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const APPELLANT_ROLES = [
  "The complaining agent",
  "The respondent",
] as const;

export type AppealRow = {
  id: string;
  dispute_id: string | null;
  appellant_name: string;
  appellant_role: string;
  appellant_email: string;
  state: string | null;
  hearing_date: string | null;
  new_evidence: string;
  submitted_on: string;
  created_at: string;
};

export const appealsQuery = {
  queryKey: ["dispute_appeals"],
  queryFn: async (): Promise<AppealRow[]> => {
    const { data, error } = await supabase
      .from("dispute_appeals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AppealRow[];
  },
};

export const appealRequestSchema = z.object({
  submitted_by: z.string().trim().min(2, "Enter your full name").max(120),
  submission_date: z.string().min(1, "Submission date is required"),
  appellant_role: z.string().min(1, "Tell us which party you are"),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").max(255),
  hearing_date: z.string().min(1, "The internal dispute hearing date is required"),
  new_evidence: z.string().trim().min(20, "Describe the new evidence being submitted").max(6000),
});
