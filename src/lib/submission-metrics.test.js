import { test, expect } from 'bun:test';
import { submissionTypeCounts, datedSubmissions, filterSubmissionDates, monthlySubmissions } from './submission-metrics';
test('report hearing requests, responses and appeals separately without counting manually logged cases as form submissions', () => {
  expect(submissionTypeCounts([{source:'public_form'},{source:'manual'},{source:'public_form'}],[{},{}],[{}]).map(row => [row.type,row.count])).toEqual([['hearing_request',2],['response',2],['appeal',1]]);
});
test('submission reporting shows zero for each category with no authorized records', () => {
  expect(submissionTypeCounts([],[],[]).map(row => row.count)).toEqual([0,0,0]);
});

test('requests, responses and appeals use their recorded filing dates, not later receipt or edit dates', () => {
  const rows = datedSubmissions([
    {id:'case',source:'public_form',filed_at:'2026-09-30',filed_by:'Complainant',title:'A v. B',created_at:'2026-10-01T01:00:00Z'},
    {id:'manual',source:'manual',filed_at:'2026-09-30',title:'Manual',filed_by:null,created_at:'2026-10-01T01:00:00Z'},
  ],[{id:'response',submitted_on:'2026-10-02',responder_name:'Respondent',dispute_id:'case',created_at:'2026-10-03T01:00:00Z'}],
  [{id:'appeal',submitted_on:'2026-11-01',appellant_name:'Appellant',dispute_id:'case',created_at:'2026-11-02T01:00:00Z'}]);
  expect(rows.map(row => [row.type,row.date])).toEqual([['appeal','2026-11-01'],['response','2026-10-02'],['hearing_request','2026-09-30']]);
  expect(monthlySubmissions(rows)).toEqual([
    {month:'2026-09',hearing_request:1,response:0,appeal:0,total:1},
    {month:'2026-10',hearing_request:0,response:1,appeal:0,total:1},
    {month:'2026-11',hearing_request:0,response:0,appeal:1,total:1},
  ]);
  expect(filterSubmissionDates(rows,'2026-10-02','2026-11-01').map(row => row.id)).toEqual(['appeal','response']);
});