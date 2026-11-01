export function submissionTypeCounts(requests: { source: string }[], responses: unknown[], appeals: unknown[]) {
  return [
    { type: 'hearing_request', label: 'Hearing requests', participant: 'Complainant', count: requests.filter(request => request.source === 'public_form').length },
    { type: 'response', label: 'Hearing responses', participant: 'Respondent', count: responses.length },
    { type: 'appeal', label: 'Appeal requests', participant: 'Appellant', count: appeals.length },
  ];
}