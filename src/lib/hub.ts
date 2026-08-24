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
