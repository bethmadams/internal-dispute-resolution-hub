import { expect, test } from 'bun:test';
import { caseTimeline } from './case-timeline';
const change = (id,from,to,at) => ({id,record_type:'disputes',action:'UPDATE',before_data:{stage:from},after_data:{stage:to},created_at:at});

test('stage timeline uses recorded transition dates and keeps revisits without assuming completion', () => {
  const timeline = caseTimeline('New Submission',[
    change('back','In Progress','New Submission','2026-11-01T02:31:21Z'),
    change('start','New Submission','In Progress','2026-11-01T02:31:17Z'),
    change('edit','New Submission','New Submission','2026-11-01T03:42:26Z'),
  ]);
  expect(timeline.transitions.map(row=>row.id)).toEqual(['start','back']);
  expect(timeline.stages.find(row=>row.stage==='New Submission')).toMatchObject({status:'Current',enteredAt:'2026-11-01T02:31:21Z'});
  expect(timeline.stages.find(row=>row.stage==='In Progress')).toMatchObject({status:'Previously visited',enteredAt:'2026-11-01T02:31:17Z',exitedAt:'2026-11-01T02:31:21Z'});
  expect(timeline.stages.find(row=>row.stage==='Closed')).toMatchObject({status:'Not recorded',enteredAt:null,exitedAt:null});
});
test('missing stage history never fabricates stage dates or marks earlier stages completed', () => {
  const timeline=caseTimeline('Decision Review',[]);
  expect(timeline.stages.find(row=>row.stage==='Decision Review')).toMatchObject({status:'Current',enteredAt:null});
  expect(timeline.stages.filter(row=>row.status==='Not recorded')).toHaveLength(11);
});