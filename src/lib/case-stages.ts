export const CASE_STAGE_GUIDE = {
  'New Submission': { phase: null, tab: 'submission', action: 'Review submission', checkpoint: 'Review the hearing request and confirm the assigned investigator.' },
  'In Progress': { phase: 'Pre-hearing', tab: 'checklist', action: 'Open pre-hearing checklist', checkpoint: 'Begin case review and send the Regulatory Relations status update.' },
  'Eligibility Review': { phase: 'Pre-hearing', tab: 'workflow', action: 'Review eligibility', checkpoint: 'Confirm unsuccessful mediation, active-agent status, regional review and voluntary participation.' },
  'Awaiting Response': { phase: 'Pre-hearing', tab: 'communications', action: 'Review invitation and delivery', checkpoint: 'Send the respondent invitation and track defense paperwork from confirmed email acceptance.' },
  'Evidence Review': { phase: 'Pre-hearing', tab: 'documents', action: 'Review evidence', checkpoint: 'Check both parties’ documents, signed agreements and witness statements.' },
  'Panel Selection': { phase: 'Pre-hearing', tab: 'panel', action: 'Review panel and challenges', checkpoint: 'Confirm approved panelists, state conflicts, confidentiality and party challenges before scheduling.' },
  'Hearing Scheduled': { phase: 'Hearing', tab: 'checklist', action: 'Open hearing checklist', checkpoint: 'Confirm notices, calendar invitations, room, chair script and hearing packet.' },
  'Decision Review': { phase: 'Post-hearing', tab: 'workflow', action: 'Review decision and acknowledgments', checkpoint: 'Record signed findings and obtain director and broker acknowledgments before releasing the decision.' },
  'Appeal Window': { phase: 'Appeal', tab: 'workflow', action: 'Review appeal window', checkpoint: 'Track the recorded 15-calendar-day appeal window; hold payout until expiry or appeal resolution.' },
  'Appeal Filed': { phase: 'Appeal', tab: 'workflow', action: 'Review appeal', checkpoint: 'Review genuinely new information with the original panel and record the outcome.' },
  'Compliance Follow-up': { phase: 'Post-hearing', tab: 'workflow', action: 'Review compliance', checkpoint: 'Confirm payout, repayment, required education, certificates and broker follow-up.' },
  'Closed': { phase: null, tab: 'history', action: 'Review retained records', checkpoint: 'Confirm final disposition and retain records. Participant access is removed on closure.' },
} as const;

export type CaseStage = keyof typeof CASE_STAGE_GUIDE;
export const CHECKLIST_STAGES = Object.keys(CASE_STAGE_GUIDE) as CaseStage[];

export function stageChecklistPhase(stage: string) {
  return CASE_STAGE_GUIDE[stage as CaseStage]?.phase ?? null;
}