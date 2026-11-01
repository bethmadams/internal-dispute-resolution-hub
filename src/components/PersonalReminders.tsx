import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Plus, Pencil, Trash2, Check, RotateCcw, AlarmClock, ArrowUpRight, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { remindersQuery, saveReminder } from "@/lib/reminders";
import { LEAD_OPTIONS, ownsReminder, reminderStatus, canManageReminder, type Reminder } from "@/lib/reminder-rules";
import { dispatchReminderHub } from "@/lib/reminder-hub.functions";
import { disputesQuery, formatDateTime } from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Editor = { reminder?: Reminder; caseId: string };
function ReminderEditor({ editor, close }: { editor: Editor; close: () => void }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const dispatch = useServerFn(dispatchReminderHub);
  const r = editor.reminder;
  const [body, setBody] = useState(r?.body ?? "");
  const [date, setDate] = useState<Date | undefined>(r ? new Date(r.due_at) : undefined);
  const [time, setTime] = useState(r ? format(new Date(r.due_at), "HH:mm") : "09:00");
  const [lead, setLead] = useState(String(r?.lead_minutes ?? 0));
  const [assignee, setAssignee] = useState(r?.user_id ?? user?.id ?? "");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!assignee && user?.id) setAssignee(user.id); }, [assignee, user?.id]);
  const { data: people = [] } = useQuery({ queryKey: ["reminder-eligible", editor.caseId], queryFn: async () => {
    const { data, error } = await supabase.rpc("reminder_eligible_users", { _dispute_id: editor.caseId });
    if (error) throw error; return data ?? [];
  } });
  const save = async () => {
    if (!date || !body.trim() || !time || !assignee) return;
    const due = new Date(date); const [h, m] = time.split(":").map(Number);
    if (h === undefined || m === undefined || !Number.isFinite(h) || !Number.isFinite(m)) return;
    due.setHours(h, m, 0, 0);
    setBusy(true);
    try {
      const id = await saveReminder(r ? "edit" : "create", { ...(r ? { id: r.id } : { dispute_id: editor.caseId }), body: body.trim(), due_at: due.toISOString(), lead_minutes: Number(lead), user_id: assignee });
      void queryClient.invalidateQueries({ queryKey: ["personal_reminders"] });
      close(); toast.success(r ? "Reminder updated" : "Reminder created");
      if (!r && id) {
        try { const result = await dispatch({ data: { id } }); if (!["sent", "already_claimed", "staff_only"].includes(result.status)) toast.warning("Reminder saved; Hub announcement is pending or unavailable."); }
        catch { toast.warning("Reminder saved; Hub announcement could not be confirmed."); }
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save reminder"); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) close(); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{r ? "Edit reminder" : "Add reminder"}</DialogTitle></DialogHeader>
    <div className="space-y-4"><div className="space-y-2"><Label htmlFor="reminder-body">Reminder *</Label><Textarea id="reminder-body" value={body} onChange={e => setBody(e.target.value)} required /></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Due date *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="size-4" />{date ? format(date, "MMM d, yyyy") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" /></PopoverContent></Popover></div><div className="space-y-2"><Label htmlFor="reminder-time">Due time *</Label><Input id="reminder-time" type="time" value={time} onChange={e => setTime(e.target.value)} required /></div></div>
    <div className="space-y-2"><Label>Advance notice</Label><Select value={lead} onValueChange={setLead}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_OPTIONS.map(([n, label]) => <SelectItem key={n} value={String(n)}>{label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label>Assigned to *</Label><Select value={assignee} onValueChange={setAssignee}><SelectTrigger><SelectValue placeholder="Select teammate" /></SelectTrigger><SelectContent><Input aria-label="Search eligible teammates" placeholder="Search teammates…" value={search} onChange={e => setSearch(e.target.value)} className="mb-2" />{people.filter(p => `${p.full_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())).map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}{p.id === user?.id ? " (me)" : ""}</SelectItem>)}</SelectContent></Select></div></div>
    <DialogFooter><Button variant="outline" onClick={close} disabled={busy}>Cancel</Button><Button disabled={busy || !date || !body.trim() || !time || !assignee} onClick={() => void save()}>{busy ? "Saving…" : "Save reminder"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

export function PersonalReminders({ caseId }: { caseId?: string }) {
  const { user } = useCurrentUser(); const queryClient = useQueryClient();
  const { data: reminders = [], isPending, error } = useQuery(remindersQuery);
  const { data: cases = [] } = useQuery(disputesQuery);
  const [scope, setScope] = useState("mine"); const [status, setStatus] = useState("open"); const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false); const [editor, setEditor] = useState<Editor | null>(null);
  const [snooze, setSnooze] = useState<Reminder | null>(null); const [quantity, setQuantity] = useState("1"); const [unit, setUnit] = useState("hours");
  const [deleting, setDeleting] = useState<Reminder | null>(null); const [busy, setBusy] = useState(false);
  const base = reminders.filter(r => (!caseId || r.dispute_id === caseId) && (caseId && showAll || ownsReminder(r, user?.id ?? "", scope)));
  const filtered = base.filter(r => reminderStatus(r, status) && `${r.body} ${cases.find(c => c.id === r.dispute_id)?.title ?? ""} ${r.user_email} ${r.created_by_email}`.toLowerCase().includes(search.toLowerCase()));
  const act = async (action: string, r: Reminder, extra: Record<string, string | boolean | number> = {}) => {
    setBusy(true); try { await saveReminder(action, { id: r.id, ...extra }); void queryClient.invalidateQueries({ queryKey: ["personal_reminders"] }); setSnooze(null); setDeleting(null); } catch { toast.error("Unable to update reminder"); } finally { setBusy(false); }
  };
  return <section className={caseId ? "border-t border-border pt-6" : "space-y-5"}>
    {caseId && <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Reminders</h2><Button size="sm" onClick={() => setEditor({ caseId })}><Plus className="size-4" />Add reminder</Button></div>}
    {caseId && <Label className="mb-4 flex items-center gap-2"><Checkbox checked={showAll} onCheckedChange={v => setShowAll(v === true)} />Show reminders from all users</Label>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><Input aria-label="Search reminders" placeholder="Search reminders, matters, people…" value={search} onChange={e => setSearch(e.target.value)} className="bg-card pl-10" /></div>
    {!caseId && <Select value={scope} onValueChange={setScope}><SelectTrigger className="w-full bg-card sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mine">Assigned to me</SelectItem><SelectItem value="others">I assigned to others</SelectItem><SelectItem value="all">All</SelectItem></SelectContent></Select>}
    <div className="flex rounded-md border bg-card p-1" role="group" aria-label="Reminder status">{["open", "due", "done", "all"].map(s => <Button key={s} size="sm" variant={status === s ? "secondary" : "ghost"} onClick={() => setStatus(s)}>{s[0]?.toUpperCase()}{s.slice(1)}{(s === "open" || s === "due") && ` (${base.filter(r => reminderStatus(r, s)).length})`}</Button>)}</div></div>
    {error ? <p className="py-8 text-destructive">Unable to load reminders.</p> : isPending ? <p className="py-8 text-muted-foreground">Loading reminders…</p> : !filtered.length ? <div className="py-14 text-center text-muted-foreground"><AlarmClock className="mx-auto size-7" /><p className="mt-3 text-sm">No {status === "all" ? "matching" : status} reminders.</p></div> : <ul className="mt-4 divide-y border-y">{filtered.map(r => {
      const matter = cases.find(c => c.id === r.dispute_id); const canManage = canManageReminder(r, user?.id ?? "");
      return <li key={r.id} className="flex flex-wrap justify-between gap-4 py-5"><div className="min-w-0 flex-1"><h3 className={`break-words text-sm font-semibold ${r.done ? "text-muted-foreground line-through" : ""}`}>{r.body}</h3><p className="mt-1 text-sm text-primary">{matter?.case_number} · {matter?.title}</p><p className="mt-2 text-xs text-muted-foreground">Due {formatDateTime(r.due_at)} · Notify {formatDateTime(r.remind_at)}</p><p className="mt-1 break-words text-xs text-muted-foreground">Assigned to {r.user_email} · Created by {r.created_by_email}</p></div><div className="flex flex-wrap items-start gap-1">{canManage && <><Button variant="ghost" size="icon" title={r.done ? "Reopen" : "Mark done"} aria-label={r.done ? "Reopen reminder" : "Mark reminder done"} onClick={() => void act("done", r, { done: !r.done })} disabled={busy}>{r.done ? <RotateCcw className="size-4" /> : <Check className="size-4" />}</Button><Button variant="ghost" size="icon" title="Edit reminder" aria-label="Edit reminder" onClick={() => setEditor({ reminder: r, caseId: r.dispute_id })}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" title="Snooze reminder" aria-label="Snooze reminder" onClick={() => setSnooze(r)} disabled={r.done}><AlarmClock className="size-4" /></Button><Button variant="ghost" size="icon" title="Delete reminder" aria-label="Delete reminder" onClick={() => setDeleting(r)}><Trash2 className="size-4" /></Button></>}<Button variant="outline" size="sm" asChild><Link to="/cases/$caseId" params={{ caseId: r.dispute_id }}>Open matter<ArrowUpRight className="size-4" /></Link></Button></div></li>;
    })}</ul>}
    {editor && <ReminderEditor key={editor.reminder?.id ?? "new"} editor={editor} close={() => setEditor(null)} />}
    <Dialog open={Boolean(snooze)} onOpenChange={v => { if (!v) setSnooze(null); }}><DialogContent><DialogHeader><DialogTitle>Snooze reminder</DialogTitle></DialogHeader><div className="flex gap-3"><Input aria-label="Snooze quantity" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["minutes", "hours", "days", "weeks", "months"].map(u => <SelectItem value={u} key={u}>{u}</SelectItem>)}</SelectContent></Select></div><DialogFooter><Button disabled={busy || !Number.isInteger(Number(quantity)) || Number(quantity) < 1} onClick={() => { if (snooze) void act("snooze", snooze, { quantity: Number(quantity), unit }); }}>Snooze</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={v => { if (!v) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Delete reminder?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">The matter and its documents will remain unchanged.</p><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => { if (deleting) void act("delete", deleting); }}>Delete reminder</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}