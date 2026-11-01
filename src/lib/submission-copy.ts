export const submissionTables = {
  hearing_request: "hearing_request_submissions",
  hearing_response: "hearing_response_submissions",
  appeal: "appeal_submissions",
} as const;
export type SubmissionType = keyof typeof submissionTables;
export function canReadSubmissionCopies(roles: string[]) {
  // Any signed-in portal user with an assigned role may read submissions.
  return roles.length > 0;
}
export const SUBMITTER_LABELS: Record<SubmissionType, string> = {
  hearing_request: "Complainant",
  hearing_response: "Respondent",
  appeal: "Appellant",
};
export function submitterLabel(type: SubmissionType, payload?: Record<string, unknown> | null) {
  const role = payload?.['appellant_role'];
  if (type === 'appeal' && typeof role === 'string' && role) return `Appellant (${role})`;
  return SUBMITTER_LABELS[type];
}
export function copyRow(id: string, payload: Record<string, unknown>, createdAt: string) {
  return {
    id,
    submitted_by: payload['filed_by'] ?? payload['responder_name'] ?? payload['appellant_name'] ?? null,
    state: payload['state'] ?? null,
    submitted_on: payload['filed_at'] ?? payload['submitted_on'] ?? null,
    summary: payload['description'] ?? payload['summary'] ?? payload['new_evidence'] ?? null,
    created_at: createdAt,
    payload,
  };
}