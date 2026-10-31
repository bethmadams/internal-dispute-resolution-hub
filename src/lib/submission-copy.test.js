import { describe, expect, test } from 'bun:test';
import { canReadSubmissionCopies, copyRow, submissionTables } from './submission-copy';
describe('external submission requirements', () => {
  test('only admins and investigators can read copies', () => {
    expect(canReadSubmissionCopies(['admin'])).toBe(true);
    expect(canReadSubmissionCopies(['investigator'])).toBe(true);
    for (const role of ['viewer', 'complainant', 'respondent', 'panel_member', 'panel_chair', 'broker', 'director']) expect(canReadSubmissionCopies([role])).toBe(false);
    expect(canReadSubmissionCopies([])).toBe(false);
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