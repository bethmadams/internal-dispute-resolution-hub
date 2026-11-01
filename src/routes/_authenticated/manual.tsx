import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, BookOpen, Download } from "lucide-react";
import process from "@/lib/case-process.json";
import { portalHead, SOP_DOCUMENT_URL } from "@/lib/portal-library";
import { WorkspaceHeading } from "@/components/WorkspaceHeading";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/manual")({
  head: () => portalHead("User Manual & SOP", "Checklist-based case workflow, responsibilities, deadlines and a distributable SOP summary for the eXp Internal Dispute Resolution Portal."),
  component: Manual,
});
const sections = [
  { title: "Access and responsibilities", text: "Registration is invitation-only. Admins manage users and permission levels. Admins and investigators work across cases; other participants have read-only access to cases individually assigned to them. Case access is removed when a matter closes." },
  { title: "Intake and case board", text: "Public Hearing Request, Hearing Response and Appeal Request links are in Resources. Complaint cards use the parties’ last names. A uniquely matching response attaches to the open complaint; staff review unmatched responses. Log a dispute is for staff-entered or legacy matters." },
  { title: "Case documents", text: "Open a case to review its document area. Intake attachments and staff uploads are grouped with the matter. Available documents can be previewed or downloaded. Staff manage evidence categories and visibility; participants only receive documents authorized for their case." },
  { title: "SOP tasks, deadlines and reminders", text: "Staff add SOP tasks within a case and select the responsible person. Confirm the starting event, excluded holidays and final date before applying a deadline. My Reminders lists personal case-linked reminders separately from SOP tasks. Staff can review AI-suggested reminder details before saving; those suggestions do not change SOP deadlines." },
  { title: "Panel and hearing preparation", text: "Complete mediation and intake review before scheduling. Staff select panelists and review state-license conflicts and participant challenges. Use the current hearing checklists and selected-document hearing packet. Hearings are not recorded." },
  { title: "Decision, appeal and follow-up", text: "Staff track decision review and acknowledgments before controlled release to parties. The uploaded SOP governs the 48-hour review and 15-calendar-day appeal window. Track repayment and continuing education requirements through confirmed case deadlines." },
  { title: "Notifications and eXp Hub", text: "The red bell shows new activity and urgent deadlines. My Notifications displays the recent notification feed. Portal notifications are mirrored to the Internal Dispute Resolution Notification Hub channel while a staff member has the portal open, with the territory investigator tagged and a matter link when a case is linked." },
  { title: "Administration and archives", text: "Admins invite team members, change roles and remove user access from Admin. Staff grant case-specific access inside a matter. Only admins can delete cards; review the confirmation before deleting. Case archives and exports are available to authorized staff." },
];
function Manual() {
  return <div className="space-y-8"><WorkspaceHeading eyebrow="Reference" title="User Manual | SOP"><div className="flex flex-wrap gap-2"><Button asChild><a href="/documents/idr-case-process.pdf" download="eXp-IDR-Case-Process.pdf"><Download className="size-4" />Download workflow PDF</a></Button><Button variant="outline" asChild><a href={SOP_DOCUMENT_URL} target="_blank" rel="noreferrer"><BookOpen className="size-4" />Open governing SOP<ExternalLink className="size-4" /></a></Button></div></WorkspaceHeading>
    <section className="space-y-6 border-b border-border pb-8"><div className="max-w-4xl space-y-3"><h2 className="text-xl font-semibold">Case process workflow</h2><p className="text-sm font-medium text-primary">{process.status}</p><p className="text-sm leading-7 text-muted-foreground">{process.authority}</p></div>
    <ol className="divide-y divide-border">{process.phases.map((phase, i) => <li key={phase.title} className="grid gap-4 py-6 md:grid-cols-[3rem_1fr]"><span className="text-xl font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span><div className="max-w-4xl space-y-3"><h3 className="text-lg font-semibold">{phase.title}</h3><p className="text-sm font-medium text-primary">{phase.stage}</p><p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Responsible:</span> {phase.owner}</p><ul className="list-disc space-y-2 pl-5 text-sm leading-7">{phase.steps.map(step => <li key={step}>{step}</li>)}</ul><p className="border-l-2 border-primary pl-4 text-sm leading-6"><span className="font-semibold">Checkpoint:</span> {phase.gate}</p></div></li>)}</ol>
    <div className="max-w-4xl space-y-3"><h3 className="text-base font-semibold">Operating notes and authority</h3><ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">{process.cautions.map(note => <li key={note}>{note}</li>)}</ul></div></section>
    <h2 className="text-xl font-semibold">Portal user manual</h2>
    <Accordion type="multiple" defaultValue={["Access and responsibilities"]}>{sections.map((s, i) => <AccordionItem key={s.title} value={s.title}><AccordionTrigger className="py-5 text-base"><span className="flex items-center gap-4"><span className="text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>{s.title}</span></AccordionTrigger><AccordionContent className="max-w-3xl pb-6 text-sm leading-7 text-muted-foreground">{s.text}</AccordionContent></AccordionItem>)}</Accordion>
    <Button variant="outline" asChild><Link to="/resources">Open resource library</Link></Button>
  </div>;
}