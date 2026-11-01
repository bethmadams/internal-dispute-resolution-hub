import { CHECKLIST_STAGES, type CaseStage } from './case-stages';

type AuditEvent = { id: string; record_type: string; action: string; before_data: unknown; after_data: unknown; created_at: string };
function recordedStage(value: unknown): CaseStage | undefined {
  if (!value || typeof value !== 'object' || !('stage' in value)) return undefined;
  return CHECKLIST_STAGES.find(stage => stage === value.stage);
}

export function caseTimeline(current: CaseStage, audit: AuditEvent[]) {
  const transitions = audit.flatMap(event => {
    const from = recordedStage(event.before_data);
    const to = recordedStage(event.after_data);
    if (event.record_type !== 'disputes' || event.action !== 'UPDATE' || !from || !to || from === to || !Number.isFinite(Date.parse(event.created_at))) return [];
    return [{ id: event.id, from, to, at: event.created_at }];
  }).sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id));
  return {
    transitions,
    stages: CHECKLIST_STAGES.map(stage => {
      const entries = transitions.filter(event => event.to === stage);
      const exits = transitions.filter(event => event.from === stage);
      return { stage, status: stage === current ? 'Current' : entries.length || exits.length ? 'Previously visited' : 'Not recorded', enteredAt: entries.at(-1)?.at ?? null, exitedAt: exits.at(-1)?.at ?? null, visits: entries.length };
    }),
  };
}