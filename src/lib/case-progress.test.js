import { test, expect } from 'bun:test';
import { caseDeadlines } from './case-progress';

test('case deadlines stay linked to the case and exclude completed tasks', () => {
  const tasks = [
    { id: 'later', dispute_id: 'a', title: 'Defense paperwork', due_at: '2026-11-10T12:00:00Z', completed_at: null, assignee_id: 'investigator' },
    { id: 'first', dispute_id: 'a', title: 'Mediation', due_at: '2026-11-02T12:00:00Z', completed_at: null, assignee_id: 'broker' },
    { id: 'done', dispute_id: 'a', title: 'Done', due_at: '2026-11-01T12:00:00Z', completed_at: '2026-10-31T12:00:00Z' },
    { id: 'other', dispute_id: 'b', title: 'Private case', due_at: '2026-11-01T12:00:00Z', completed_at: null },
  ];
  const result = caseDeadlines('a', null, tasks);
  expect(result.map(d => d.id)).toEqual(['first', 'later']);
  expect(result[0].assigneeId).toBe('broker');
});

test('recorded workflow dates are shown without inventing deadlines or repeating a task', () => {
  const workflow = { repayment_due_at: '2026-11-15T12:00:00Z', repayment_received_at: null, appeal_due_at: null, ce_due_at: '2027-02-01T12:00:00Z', ce_completed_at: '2026-11-01T12:00:00Z' };
  expect(caseDeadlines('a', null, [], workflow).map(d => d.id)).toEqual(['repayment']);
  expect(caseDeadlines('a', null, [{ id: 'task', dispute_id: 'a', title: 'Repayment', template_key: 'repayment', due_at: workflow.repayment_due_at, completed_at: null }], workflow).map(d => d.id)).toEqual(['task']);
});