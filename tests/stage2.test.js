import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgress,completeFloor,canUseElevator,beginElevator,updateElevator,isMatchSolved,isWiringSolved,WIRING_TEMPLATE,CUBE_SOLUTION,isCubeSolved} from '../src/stage2-state.js';

test('floor completion unlocks elevator and arrival unlocks next floor',()=>{
  const p=createProgress();
  assert.equal(p.currentFloor,1);assert.equal(canUseElevator(p),false);
  assert.equal(completeFloor(p),true);assert.equal(canUseElevator(p),true);
  assert.equal(beginElevator(p),true);assert.equal(p.mode,'elevator');
  assert.equal(updateElevator(p,.5),false);assert.equal(p.currentFloor,1);
  assert.equal(updateElevator(p,1),true);assert.equal(p.currentFloor,2);assert.equal(p.floors[2].unlocked,true);assert.equal(p.mode,'floor');
});
test('match puzzle requires every symbol paired to itself',()=>{
  assert.equal(isMatchSolved({hex:'hex',bolt:'bolt',tri:'tri'}),true);
  assert.equal(isMatchSolved({hex:'bolt',bolt:'hex',tri:'tri'}),false);
});
test('wiring solver accepts a real connected path',()=>{
  const r=[2,0,0,1,0,0,0,0,0];
  assert.equal(isWiringSolved(r),true);
  const bad=[...r];bad[6]=1;assert.equal(isWiringSolved(bad),false);
  assert.equal(WIRING_TEMPLATE.length,9);
});
test('cube puzzle validates exact target arrangement',()=>{
  assert.equal(isCubeSolved([...CUBE_SOLUTION]),true);
  const wrong=[...CUBE_SOLUTION];[wrong[0],wrong[1]]=[wrong[1],wrong[0]];
  assert.equal(isCubeSolved(wrong),false);
});
