export const submissionTables = {
  hearing_request: "hearing_request_submissions",
  hearing_response: "hearing_response_submissions",
  appeal: "appeal_submissions",
} as const;
export type SubmissionType = keyof typeof submissionTables;
export function canReadSubmissionCopies(roles: string[]) {
  return roles.includes("admin") || roles.includes("investigator");
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