import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { SOP_TASKS, calculateDue } from './sop-rules';

const sql = readFileSync(new URL('../../drizzle/migrations/0010_stage_checklist_automation.sql', import.meta.url), 'utf8');
test('database stage templates stay aligned with canonical checklists', () => {
  const templates = [...sql.matchAll(/\('([^']+)','(Pre-hearing|Hearing|Post-hearing|Appeal)','((?:[^']|'')*)'\)/g)].map(match => ({ key: match[1], phase: match[2], title: match[3].replaceAll("''", "'") }));
  expect(templates).toEqual(SOP_TASKS);
});
test('respondent invitation sets a ten calendar day deadline', () => {
  expect(calculateDue('2026-10-31T19:00:00Z', { days: 10 })).toBe('2026-11-10T19:00:00.000Z');
  expect(sql).toContain("_response_sent_at+interval '240 hours'");
});