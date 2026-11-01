import { describe, expect, test } from 'bun:test';
import { caseTitle, hasStaffRole, scopeSubmissionIds } from './case-rules';

describe('case privacy and naming', () => {
  test('case is named complainant last name v. respondent last name', () => {
    expect(caseTitle('Jane Marie Smith', 'John Jones', 'Complaint')).toBe('Smith v. Jones');
    expect(caseTitle(' Jane Smith  ', 'John van Jones', 'Complaint')).toBe('Smith v. Jones');
    expect(caseTitle(null, 'John Jones', 'Legacy case')).toBe('Legacy case');
  });
  test('only admins and investigators have all-case access', () => {
    expect(hasStaffRole(['admin'])).toBe(true);
    expect(hasStaffRole(['viewer', 'investigator'])).toBe(true);
    for (const role of ['viewer', 'complainant', 'respondent', 'panel_member', 'panel_chair', 'broker', 'director']) {
      expect(hasStaffRole([role])).toBe(false);
      expect(scopeSubmissionIds([role], ['assigned-case-row'])).toEqual(['assigned-case-row']);
      expect(scopeSubmissionIds([role], [])).toEqual([]);
    }
    expect(scopeSubmissionIds(['admin'], [])).toBeNull();
  });
});