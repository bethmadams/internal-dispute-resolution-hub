export const LEAD_OPTIONS = [
  [0, "At the due date/time"], [5, "5 minutes before"], [10, "10 minutes before"],
  [15, "15 minutes before"], [30, "30 minutes before"], [60, "1 hour before"],
  [120, "2 hours before"], [1440, "1 day before"], [2880, "2 days before"],
  [10080, "1 week before"], [43200, "1 month before (30 days)"],
] as const;
export type Reminder = {
  id: string; dispute_id: string; user_id: string; user_email: string;
  created_by: string; created_by_email: string; body: string; due_at: string;
  lead_minutes: number; remind_at: string; done: boolean; notified_at: string | null;
};
export function notificationTime(due: string, lead: number) {
  return new Date(Date.parse(due) - lead * 60000).toISOString();
}
export function snoozeTime(now: number, quantity: number, unit: string) {
  const minutes: Record<string, number> = { minutes: 1, hours: 60, days: 1440, weeks: 10080, months: 43200 };
  const factor = minutes[unit];
  if (!Number.isInteger(quantity) || quantity < 1 || !factor) throw new Error("Invalid snooze");
  return new Date(now + quantity * factor * 60000).toISOString();
}
export function ownsReminder(r: Reminder, userId: string, scope: string) {
  return scope === "mine" ? r.user_id === userId : scope === "others" ? r.created_by === userId && r.user_id !== userId : r.user_id === userId || r.created_by === userId;
}
export function reminderStatus(r: Reminder, status: string, now = Date.now()) {
  return status === "all" || (status === "done" ? r.done : !r.done && (status !== "due" || Date.parse(r.remind_at) <= now));
}
export function canManageReminder(r: Reminder, userId: string) { return r.user_id === userId || r.created_by === userId; }