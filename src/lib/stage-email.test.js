import { test, expect } from 'bun:test';
import { stageEmail, rawStageEmail } from './stage-email';
import {readFileSync} from 'node:fs';
const matter = { id: 'case-id', title: 'Smith v. Jones', complainant_email: 'complainant@example.com', respondent_email: 'respondent@example.com', mb_dmb_email: 'broker@example.com' };
test('New Submission receipts go to complainant and MB/DMB', () => {
  const mail = stageEmail(matter, 'New Submission', null, 'https://portal.example.com', null);
  expect(mail.to).toEqual(['complainant@example.com','broker@example.com']);
  expect(mail.cc).toEqual([]);
});
for (const stage of ['In Progress','Awaiting Response']) test(`${stage} sends to respondent with approved copies`, () => {
  const mail = stageEmail(matter, stage, 'investigator@example.com', 'https://portal.example.com', null);
  expect(mail.to).toEqual(['respondent@example.com']);
  expect(mail.cc).toEqual(['complainant@example.com','investigator@example.com','broker@example.com']);
});
test('missing MB/DMB blocks sending rather than substituting another recipient', () => {
  expect(() => stageEmail({...matter, mb_dmb_email: null}, 'New Submission', null, 'https://portal.example.com', null)).toThrow();
});
test('mail always uses approved Regulatory Relations sender', () => {
  const raw = rawStageEmail(stageEmail(matter, 'New Submission', null, 'https://portal.example.com', null));
  expect(Buffer.from(raw, 'base64url').toString('utf8')).toContain('From: Regulatory Relations <regulatoryrelations@exprealty.net>');
});
test('response deadline is ten days after confirmed sending and retains an existing deadline',()=>{
  const sql=readFileSync(new URL('../../drizzle/migrations/0014_stage_email_queue.sql',import.meta.url),'utf8');
  expect(sql).toContain("_sent_at+interval '240 hours'");
  expect(sql).toContain('WHERE case_tasks.due_at IS NULL AND case_tasks.completed_at IS NULL');
});