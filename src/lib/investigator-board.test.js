import {test,expect} from 'bun:test';
import {investigatorBoardCases} from './investigator-board';
const cases=[{id:'anna-case',assigned_to:'anna'},{id:'carlo-case',assigned_to:'carlo'},{id:'unassigned',assigned_to:null}];
test('each investigator board contains only that investigator assignments',()=>{
 expect(investigatorBoardCases(cases,'anna',false,true).map(c=>c.id)).toEqual(['anna-case']);
 expect(investigatorBoardCases(cases,'carlo',false,true).map(c=>c.id)).toEqual(['carlo-case']);
 expect(investigatorBoardCases(cases,undefined,false,true)).toEqual([]);
});
test('admins retain all-case oversight and can filter assignments',()=>{
 expect(investigatorBoardCases(cases,'anna',true,true)).toEqual(cases);
 expect(investigatorBoardCases(cases,'anna',true,true,'carlo').map(c=>c.id)).toEqual(['carlo-case']);
 expect(investigatorBoardCases(cases,'anna',true,true,'unassigned').map(c=>c.id)).toEqual(['unassigned']);
});
test('participant boards retain only their previously authorized rows',()=>{
 expect(investigatorBoardCases([cases[0]],'participant',false,false)).toEqual([cases[0]]);
});