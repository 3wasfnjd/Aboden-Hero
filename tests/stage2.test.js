import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgress,completeFloor,canUseElevator,beginElevator,updateElevator} from '../src/stage2-state.js';

test('floor completion unlocks elevator and arrival unlocks next floor',()=>{
  const p=createProgress();
  assert.equal(p.currentFloor,1);assert.equal(canUseElevator(p),false);
  assert.equal(completeFloor(p),true);assert.equal(canUseElevator(p),true);
  assert.equal(beginElevator(p),true);assert.equal(p.mode,'elevator');
  assert.equal(updateElevator(p,.5),false);assert.equal(p.currentFloor,1);
  assert.equal(updateElevator(p,1),true);assert.equal(p.currentFloor,2);assert.equal(p.floors[2].unlocked,true);assert.equal(p.mode,'floor');
});
