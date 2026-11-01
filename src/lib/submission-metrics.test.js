import { test, expect } from 'bun:test';
import { submissionTypeCounts } from './submission-metrics';
test('report hearing requests, responses and appeals separately without counting manually logged cases as form submissions', () => {
  expect(submissionTypeCounts([{source:'public_form'},{source:'manual'},{source:'public_form'}],[{},{}],[{}]).map(row => [row.type,row.count])).toEqual([['hearing_request',2],['response',2],['appeal',1]]);
});
test('submission reporting shows zero for each category with no authorized records', () => {
  expect(submissionTypeCounts([],[],[]).map(row => row.count)).toEqual([0,0,0]);
});