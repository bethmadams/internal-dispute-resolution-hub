import { supabase } from "@/integrations/supabase/client";

export const STAGES = [
  "New Submission",
  "In Progress",
  "Hearing Scheduled",
  "Appeal Filed",
  "Closed",
] as const;
export type Stage = (typeof STAGES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Dispute = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  filed_by: string | null;
  respondent: string | null;
  department: string | null;
  stage: Stage;
  priority: Priority;
  assigned_to: string | null;
  filed_at: string;
  hearing_date: string | null;
  resolution: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  complainant_email: string | null;
  state: string | null;
  respondent_email: string | null;
  respondent_phone: string | null;
  respondent_active: boolean | null;
  reasons: string[];
  ethics_articles: string | null;
  seeking: string | null;
  steps_taken: string | null;
  property_address: string | null;
  closing_date: string | null;
  involves_money: boolean | null;
  monetary_amount: number | null;
  additional_comments: string | null;
  source: string;
};

export type DisputeNote = {
  id: string;
  dispute_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  url: string | null;
  created_by: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export type UserRole = { id: string; user_id: string; role: "admin" | "investigator" | "viewer" };

export const stageStyles: Record<Stage, string> = {
  "New Submission": "bg-stage-new/12 text-stage-new border-stage-new/25",
  "In Progress": "bg-stage-progress/12 text-stage-progress border-stage-progress/25",
  "Hearing Scheduled": "bg-stage-hearing/15 text-stage-hearing border-stage-hearing/30",
  "Appeal Filed": "bg-stage-appeal/12 text-stage-appeal border-stage-appeal/25",
  Closed: "bg-stage-closed/12 text-stage-closed border-stage-closed/25",
};

export const priorityStyles: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground border-border",
  Medium: "bg-primary/10 text-primary border-primary/20",
  High: "bg-stage-hearing/15 text-stage-hearing border-stage-hearing/30",
  Urgent: "bg-destructive/12 text-destructive border-destructive/25",
};

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const disputesQuery = {
  queryKey: ["disputes"],
  queryFn: async (): Promise<Dispute[]> => {
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("filed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Dispute[];
  },
};

export const profilesQuery = {
  queryKey: ["profiles"],
  queryFn: async (): Promise<Profile[]> => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []) as Profile[];
  },
};

export const rolesQuery = {
  queryKey: ["user_roles"],
  queryFn: async (): Promise<UserRole[]> => {
    const { data, error } = await supabase.from("user_roles").select("*");
    if (error) throw error;
    return (data ?? []) as UserRole[];
  },
};

export type TeamInvite = {
  id: string;
  email: string;
  role: "admin" | "investigator" | "viewer";
  full_name: string | null;
  invited_by: string | null;
  accepted_at: string | null;
  created_at: string;
};

export const invitesQuery = {
  queryKey: ["team_invites"],
  queryFn: async (): Promise<TeamInvite[]> => {
    const { data, error } = await supabase
      .from("team_invites")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as TeamInvite[];
  },
};

export const resourcesQuery = {
  queryKey: ["resources"],
  queryFn: async (): Promise<Resource[]> => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Resource[];
  },
};

export function nextCaseNumber(disputes: Dispute[]) {
  const year = new Date().getFullYear();
  const prefix = `IDR-${year}-`;
  const highest = disputes
    .filter((d) => d.case_number.startsWith(prefix))
    .map((d) => Number.parseInt(d.case_number.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export type CaseAccessGrant = {
  id: string;
  dispute_id: string;
  user_id: string;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
};

export const caseAccessQuery = (disputeId: string) => ({
  queryKey: ["case_access", disputeId],
  queryFn: async (): Promise<CaseAccessGrant[]> => {
    const { data, error } = await supabase
      .from("case_access")
      .select("*")
      .eq("dispute_id", disputeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CaseAccessGrant[];
  },
});
