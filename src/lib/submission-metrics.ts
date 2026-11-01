export function submissionTypeCounts(requests: { source: string }[], responses: unknown[], appeals: unknown[]) {
  return [
    { type: 'hearing_request', label: 'Hearing requests', participant: 'Complainant', count: requests.filter(request => request.source === 'public_form').length },
    { type: 'response', label: 'Hearing responses', participant: 'Respondent', count: responses.length },
    { type: 'appeal', label: 'Appeal requests', participant: 'Appellant', count: appeals.length },
  ];
}

type DatedRecord = { id: string; created_at: string };
export type SubmissionRecord = {
  id: string;
  type: 'hearing_request' | 'response' | 'appeal';
  label: string;
  name: string;
  caseName: string;
  date: string;
};

function filingDate(value: string | null | undefined, received: string) {
  const candidate = (value || received).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return '';
  const parsed = new Date(`${candidate}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate ? candidate : '';
}

export function datedSubmissions(
  requests: (DatedRecord & { source: string; filed_at: string; filed_by: string | null; title: string })[],
  responses: (DatedRecord & { submitted_on: string; responder_name: string; dispute_id: string | null })[],
  appeals: (DatedRecord & { submitted_on: string; appellant_name: string; dispute_id: string | null })[],
): SubmissionRecord[] {
  const titles = new Map(requests.map(row => [row.id, row.title]));
  return [
    ...requests.filter(row => row.source === 'public_form').map(row => ({ id: row.id, type: 'hearing_request' as const, label: 'Hearing request', name: row.filed_by || 'Not specified', caseName: row.title, date: filingDate(row.filed_at, row.created_at) })),
    ...responses.map(row => ({ id: row.id, type: 'response' as const, label: 'Hearing response', name: row.responder_name, caseName: titles.get(row.dispute_id || '') || 'Unlinked submission', date: filingDate(row.submitted_on, row.created_at) })),
    ...appeals.map(row => ({ id: row.id, type: 'appeal' as const, label: 'Appeal request', name: row.appellant_name, caseName: titles.get(row.dispute_id || '') || 'Unlinked submission', date: filingDate(row.submitted_on, row.created_at) })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function filterSubmissionDates(rows: SubmissionRecord[], from: string, to: string) {
  return rows.filter(row => (!from || row.date >= from) && (!to || (row.date !== '' && row.date <= to)));
}

export function monthlySubmissions(rows: SubmissionRecord[]) {
  const counts = new Map<string, { month: string; hearing_request: number; response: number; appeal: number; total: number }>();
  for (const row of rows) {
    if (!row.date) continue;
    const month = row.date.slice(0, 7);
    const count = counts.get(month) || { month, hearing_request: 0, response: 0, appeal: 0, total: 0 };
    count[row.type] += 1;
    count.total += 1;
    counts.set(month, count);
  }
  return [...counts.values()].sort((a, b) => a.month.localeCompare(b.month));
}