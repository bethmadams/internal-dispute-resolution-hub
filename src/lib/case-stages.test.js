import { test, expect } from 'bun:test';
import { CHECKLIST_STAGES, stageChecklistPhase, CASE_STAGE_GUIDE } from './case-stages';

test('checklist stages follow intake, response, evidence, panel, hearing, decision, appeal and compliance', () => {
  expect(CHECKLIST_STAGES).toEqual(['New Submission','In Progress','Eligibility Review','Awaiting Response','Evidence Review','Panel Selection','Hearing Scheduled','Decision Review','Appeal Window','Appeal Filed','Compliance Follow-up','Closed']);
});
test('decision and compliance initialize post-hearing tasks', () => {
  expect(stageChecklistPhase('Decision Review')).toBe('Post-hearing');
  expect(stageChecklistPhase('Compliance Follow-up')).toBe('Post-hearing');
});
test('stage guidance opens the relevant evidence and panel sections', () => {
  expect(CASE_STAGE_GUIDE['Evidence Review'].tab).toBe('documents');
  expect(CASE_STAGE_GUIDE['Panel Selection'].tab).toBe('panel');
});