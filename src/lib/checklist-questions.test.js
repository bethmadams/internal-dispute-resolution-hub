import { test, expect } from 'bun:test';
import { CHECKLIST_STAGES } from './case-stages';
import { SOP_TASKS } from './sop-rules';
import { CHECKLIST_QUESTIONS, checklistProgress } from './checklist-questions';
test('every stage has a real saved-question form and all existing checklist tasks are covered', () => {
  for (const stage of CHECKLIST_STAGES) expect(CHECKLIST_QUESTIONS[stage].length).toBeGreaterThan(0);
  const keys = Object.values(CHECKLIST_QUESTIONS).flat().map(q => q.key);
  for (const task of SOP_TASKS) expect(keys).toContain(task.key);
});
test('unanswered questions do not count as completed answers', () => {
  expect(checklistProgress('New Submission', {})).toEqual({ total: 6, answered: 0 });
  expect(checklistProgress('New Submission', { intake_parties: { status: 'yes', notes: '' }, intake_state: { status: 'pending', notes: '' } })).toEqual({ total: 6, answered: 1 });
});