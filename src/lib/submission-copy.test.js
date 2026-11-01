import { describe, expect, test } from 'bun:test';
import { canReadSubmissionCopies, copyRow, submitterLabel, submissionTables } from './submission-copy';
describe('external submission requirements', () => {
  test('role holders can request a case-scoped list', () => {
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
  test('MB/DMB email is retained in copies for every submission form', () => {
    for (const field of ['filed_by', 'responder_name', 'appellant_name']) {
      const row = copyRow('original-id', { [field]: 'Test Agent', mb_dmb_name: 'Morgan Broker', mb_dmb_email: 'broker@example.com' }, '2026-11-01');
      expect(row.payload.mb_dmb_email).toBe('broker@example.com');
      expect(row.payload.mb_dmb_name).toBe('Morgan Broker');
    }
  });
});