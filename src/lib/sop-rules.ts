export const SOP_TIMELINES = [
  { key: 'mediation', title: 'Attempt broker mediation', phase: 'Pre-hearing', days: 7, business: true, anchor: 'Complaint notification' },
  { key: 'response', title: 'Receive respondent defense paperwork', phase: 'Pre-hearing', days: 10, business: false, anchor: 'Staff-confirmed response clock start' },
  { key: 'witness', title: 'Receive witness statements through Regulatory Relations', phase: 'Pre-hearing', days: -5, business: false, anchor: 'Hearing date' },
  { key: 'schedule', title: 'Confirm hearing date with parties and panel', phase: 'Pre-hearing', days: 14, business: false, anchor: 'All paperwork received' },
  { key: 'notice', title: 'Notify participants of confirmed hearing', phase: 'Pre-hearing', days: -2, business: false, anchor: 'Hearing date' },
  { key: 'review', title: 'Obtain director and broker decision acknowledgment', phase: 'Post-hearing', hours: 48, anchor: 'Decision sent for review' },
  { key: 'filing', title: 'File decision email in Enterprise and Hubspot', phase: 'Post-hearing', days: 2, business: true, anchor: 'Decision email sent' },
  { key: 'repayment', title: 'Receive repayment of already-disbursed funds', phase: 'Post-hearing', days: 15, business: false, anchor: 'Staff-confirmed repayment clock start' },
  { key: 'appeal', title: 'Close appeal submission window', phase: 'Appeal', days: 15, business: false, anchor: 'Panel decision' },
  { key: 'ce', title: 'Receive live continuing education certificate', phase: 'Post-hearing', days: 90, business: false, anchor: 'Staff-confirmed education clock start' },
] as const;

export const SOP_TASKS = [
  ...SOP_TIMELINES.map(({ key, title, phase }) => ({ key, title, phase })),
  { key: 'mediation_records', title: 'Record unsuccessful mediation, Enterprise and Hubspot notes', phase: 'Pre-hearing' },
  { key: 'regional_review', title: 'Confirm Regional Director consultation and voluntary participation', phase: 'Pre-hearing' },
  { key: 'agreements', title: 'Verify both signed binding agreements and complete evidence', phase: 'Pre-hearing' },
  { key: 'panel', title: 'Select approved panel, check state conflicts and resolve party challenges', phase: 'Pre-hearing' },
  { key: 'hub_chat', title: 'Create Hub chat with panelists and MB/DMB', phase: 'Pre-hearing' },
  { key: 'calendar', title: 'Send calendar invitations with room and location details', phase: 'Pre-hearing' },
  { key: 'chair', title: 'Confirm hearing chair and chairperson script', phase: 'Hearing' },
  { key: 'room', title: 'Prepare eXp.world room, phone access and cameras', phase: 'Hearing' },
  { key: 'presentations', title: 'Hear parties and clarifying questions; record requested broker attendance', phase: 'Hearing' },
  { key: 'award', title: 'Complete Hearing Award and Final Disposition', phase: 'Hearing' },
  { key: 'release', title: 'Send reviewed decision to parties, copying broker and director', phase: 'Post-hearing' },
  { key: 'payout', title: 'Confirm appeal resolution or expiry before award payout', phase: 'Post-hearing' },
  { key: 'followup', title: 'Record broker-supervised compliance and follow-up', phase: 'Post-hearing' },
  { key: 'new_evidence', title: 'Review genuinely new appeal information and prior unavailability', phase: 'Appeal' },
  { key: 'original_panel', title: 'Refer appeal to original hearing panel', phase: 'Appeal' },
  { key: 'appeal_response', title: 'Record whether panel requests the other party’s written response', phase: 'Appeal' },
  { key: 'appeal_decision', title: 'Record panel appeal decision and communicate outcome', phase: 'Appeal' },
  { key: 'active_check', title: 'Verify respondent active and not suspended in Enterprise', phase: 'Pre-hearing' },
  { key: 'respondent_invite', title: 'Send respondent invitation from Regulatory Relations, copying MB/DMB', phase: 'Pre-hearing' },
  { key: 'panel_invite', title: 'Send proposed panelist invitations and record response deadlines', phase: 'Pre-hearing' },
  { key: 'panel_availability', title: 'Confirm panel availability and seating acceptance', phase: 'Pre-hearing' },
  { key: 'party_folders', title: 'Organize separate complainant and respondent document sets', phase: 'Pre-hearing' },
  { key: 'no_response', title: 'Review missing respondent response and notify complainant and MB/DMB', phase: 'Pre-hearing' },
  { key: 'mb_documents', title: 'Notify MB/DMB that both parties’ documents were received', phase: 'Pre-hearing' },
  { key: 'nda', title: 'Verify required panelist confidentiality agreements', phase: 'Pre-hearing' },
  { key: 'challenge_notice', title: 'Send panel list and Notice of Right to Challenge to both parties', phase: 'Pre-hearing' },
  { key: 'no_recording', title: 'Confirm hearing is not recorded', phase: 'Hearing' },
  { key: 'facts', title: 'Review Finding of Facts Worksheet and Factors for Consideration', phase: 'Hearing' },
  { key: 'complainant_time', title: 'Complainant presentation — 30 minutes', phase: 'Hearing' },
  { key: 'respondent_time', title: 'Respondent presentation — 30 minutes', phase: 'Hearing' },
  { key: 'qa_time', title: 'Panel questions — 20 minutes', phase: 'Hearing' },
  { key: 'closing', title: 'Chair reads closing statement', phase: 'Hearing' },
  { key: 'signatures', title: 'Record findings, rationale and recommendations; obtain panel signatures', phase: 'Post-hearing' },
  { key: 'agent_calls', title: 'MB/DMB discusses decision separately with each agent', phase: 'Post-hearing' },
  { key: 'icon', title: 'Notify ICON award team for eligible panelists', phase: 'Post-hearing' },
  { key: 'chat_archive', title: 'Archive Hub chat record after appeal period or appeal decision', phase: 'Post-hearing' },
  { key: 'appeal_notify', title: 'Notify MB/DMB and original chair of appeal receipt', phase: 'Appeal' },
  { key: 'appeal_parties', title: 'Notify appellant and, if requested by panel, non-appellant with new evidence', phase: 'Appeal' },
  { key: 'appeal_hearing', title: 'If panel requests a hearing, confirm date, script and appeal procedures', phase: 'Appeal' },
  { key: 'appellant_time', title: 'If appeal hearing is held: appellant presentation — 20 minutes', phase: 'Appeal' },
  { key: 'appeal_respondent_time', title: 'If appeal hearing is held: respondent presentation — 20 minutes', phase: 'Appeal' },
  { key: 'appeal_qa_time', title: 'If appeal hearing is held: panel questions — 15 minutes', phase: 'Appeal' },
];

export function calculateDue(start: string, rule: { days?: number; hours?: number; business?: boolean }, holidays: string[] = []) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid start date');
  if (rule.hours !== undefined) return new Date(date.getTime() + rule.hours * 3600000).toISOString();
  const days = rule.days ?? 0;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + Math.sign(days));
    if (!rule.business || (date.getUTCDay() !== 0 && date.getUTCDay() !== 6 && !holidays.includes(date.toISOString().slice(0, 10)))) remaining--;
  }
  return date.toISOString();
}

export function panelConflict(state: string | null, licensed: string[], teamLicensed: string[]) {
  return Boolean(state && [...licensed, ...teamLicensed].includes(state));
}
export function deadlineState(due: string | null, completed: string | null, now = Date.now()) {
  if (completed) return 'Complete';
  if (!due) return 'No due date';
  const delta = new Date(due).getTime() - now;
  return delta < 0 ? 'Overdue' : delta <= 48 * 3600000 ? 'Due soon' : 'Scheduled';
}

export function calendarInvite(title: string, start: string, duration: number, location: string, description: string) {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//eXp//IDR Portal//EN','BEGIN:VEVENT',`UID:${crypto.randomUUID()}@idr-portal`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(new Date(start))}`,`DTEND:${stamp(new Date(new Date(start).getTime()+duration*60000))}`,`SUMMARY:${escape(title)}`,`LOCATION:${escape(location)}`,`DESCRIPTION:${escape(description)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
}