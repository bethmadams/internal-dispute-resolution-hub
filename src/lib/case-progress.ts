import type { Task, Workflow } from './sop-data';

export type CaseDeadline = { id: string; title: string; dueAt: string; assigneeId: string | null };

export function caseDeadlines(caseId: string, hearingDate: string | null, tasks: Task[], workflow?: Workflow | null): CaseDeadline[] {
  const caseTasks = tasks.filter(task => task.dispute_id === caseId);
  const deadlines: CaseDeadline[] = caseTasks.flatMap(task => task.due_at && !task.completed_at
    ? [{ id: task.id, title: task.title, dueAt: task.due_at, assigneeId: task.assignee_id }] : []);
  if (hearingDate) deadlines.push({ id: 'hearing', title: 'Hearing', dueAt: hearingDate, assigneeId: null });
  if (workflow) {
    const milestones = [
      { key: 'repayment', title: 'Repayment due', due: workflow.repayment_due_at, complete: workflow.repayment_received_at },
      { key: 'appeal', title: 'Appeal window ends', due: workflow.appeal_due_at, complete: workflow.appeal_decided_at },
      { key: 'ce', title: 'Live education due', due: workflow.ce_due_at, complete: workflow.ce_completed_at },
    ];
    for (const milestone of milestones) {
      if (milestone.due && !milestone.complete && !caseTasks.some(task => task.template_key === milestone.key && task.due_at === milestone.due)) {
        deadlines.push({ id: milestone.key, title: milestone.title, dueAt: milestone.due, assigneeId: null });
      }
    }
  }
  return deadlines.filter(deadline => Number.isFinite(Date.parse(deadline.dueAt))).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}