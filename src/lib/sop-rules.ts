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