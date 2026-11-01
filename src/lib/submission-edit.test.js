import { expect, test } from 'bun:test';
import { canEditSubmissions, submissionChanges } from './submission-edit';
test('only administrators can edit submitted forms', () => {
  expect(canEditSubmissions(['admin'])).toBe(true);
  for (const role of ['investigator','viewer','complainant','respondent','panel_member','panel_chair','broker','director']) expect(canEditSubmissions([role])).toBe(false);
});
test('an administrator can complete missing information without changing case workflow', () => {
  expect(submissionChanges('hearing_request', { respondent_phone: null, stage: 'New Submission' }, { respondent_phone: '602-555-0100', stage: 'Closed' })).toEqual({ respondent_phone: '602-555-0100' });
});
test('response and appeal corrections retain their supplied information', () => {
  expect(submissionChanges('response', { mb_dmb_name: null }, { mb_dmb_name: ' Morgan Broker ' })).toEqual({ mb_dmb_name: 'Morgan Broker' });
  expect(submissionChanges('appeal', { new_evidence: 'Original evidence' }, { new_evidence: 'Additional evidence' })).toEqual({ new_evidence: 'Additional evidence' });
});
test('corrections validate email and amount without requiring untouched legacy fields', () => {
  expect(() => submissionChanges('hearing_request', {}, { complainant_email: 'invalid' })).toThrow();
  expect(() => submissionChanges('hearing_request', {}, { monetary_amount: '-1' })).toThrow();
  expect(submissionChanges('hearing_request', { respondent_active: null }, { respondent_active: null })).toEqual({});
});