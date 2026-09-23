import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgress,completeFloor,reachFloor} from '../src/stage2-state.js';

test('floors can be reached independently of challenge completion',()=>{
  const p=createProgress();
  assert.equal(p.currentFloor,1);
  assert.equal(p.floors[2].complete,false);
  assert.equal(reachFloor(p,2),true);
  assert.equal(p.currentFloor,2);
  assert.equal(p.floors[2].unlocked,true);
  assert.equal(p.floors[1].complete,false);
});

test('completing a challenge does not control elevator availability',()=>{
  const p=createProgress();
  assert.equal(completeFloor(p,1),true);
  assert.equal(p.floors[1].complete,true);
  assert.equal('elevatorReady' in p,false);
  assert.equal('elevator' in p,false);
});
