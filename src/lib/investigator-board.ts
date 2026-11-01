export function investigatorBoardCases<T extends { assigned_to: string | null }>(cases: T[], userId: string | undefined, isAdmin: boolean, isStaff: boolean, assignment = 'all'): T[] {
  if (isAdmin) return assignment === 'all' ? cases : cases.filter(c => assignment === 'unassigned' ? c.assigned_to === null : c.assigned_to === assignment);
  if (isStaff) return userId ? cases.filter(c => c.assigned_to === userId) : [];
  return cases;
}