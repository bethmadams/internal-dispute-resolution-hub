import { describe, expect, test } from 'bun:test';
import { canReadSubmissionCopies, copyRow, submitterLabel, submissionTables } from './submission-copy';
describe('external submission requirements', () => {
  test('every signed-in user with a role can read copies', () => {
    for (const role of ['admin', 'investigator', 'viewer', 'complainant', 'respondent', 'panel_member', 'panel_chair', 'broker', 'director']) expect(canReadSubmissionCopies([role])).toBe(true);
    expect(canReadSubmissionCopies([])).toBe(false);
  });
  test('submitter is identified by form', () => {
    expect(submitterLabel('hearing_request')).toBe('Complainant');
    expect(submitterLabel('hearing_response')).toBe('Respondent');
    expect(submitterLabel('appeal', { appellant_role: 'Respondent' })).toBe('Appellant (Respondent)');
  });
  test('each form uses a separate table', () => {
    expect(submissionTables.hearing_request).toBe('hearing_request_submissions');
    expect(submissionTables.hearing_response).toBe('hearing_response_submissions');
    expect(submissionTables.appeal).toBe('appeal_submissions');
    expect(new Set(Object.values(submissionTables)).size).toBe(3);
  });
  test('copies preserve the original submission identity and payload', () => {
    const payload = { responder_name: 'Test Agent', state: 'Arizona', summary: 'Response', submitted_on: '2026-10-31' };
    expect(copyRow('original-id', payload, '2026-10-31')).toEqual({ id: 'original-id', submitted_by: 'Test Agent', state: 'Arizona', summary: 'Response', submitted_on: '2026-10-31', created_at: '2026-10-31', payload });
  });
});