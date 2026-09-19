import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIRING_LAYOUT,INITIAL_ROTATIONS,SOLUTION_PATH,portsFor,isWiringSolved,
  connectedFromStart,matchesDefinedPath
} from '../puzzle-kit/wiring/wiring-logic.js';

test('pipe rotations map to expected ports',()=>{
  assert.deepEqual(portsFor('straight',0),['N','S']);
  assert.deepEqual(portsFor('straight',1),['E','W']);
  assert.deepEqual(portsFor('elbow',2),['S','W']);
  assert.deepEqual(portsFor('tee',0),['N','E','W']);
});

test('user solution path uses the requested six pieces',()=>{
  assert.deepEqual(SOLUTION_PATH,[0,4,5,6,7,11]);
  assert.deepEqual(
    SOLUTION_PATH.map(index=>WIRING_LAYOUT[index].type),
    ['elbow','elbow','straight','straight','elbow','elbow']
  );
});

test('initial wiring layout is not solved',()=>{
  assert.equal(isWiringSolved(WIRING_LAYOUT,[...INITIAL_ROTATIONS]),false);
});

test('drawn START-to-END route solves exactly as specified',()=>{
  const rotations=[...INITIAL_ROTATIONS];
  for(const index of SOLUTION_PATH){
    rotations[index]=WIRING_LAYOUT[index].solution;
  }

  assert.equal(matchesDefinedPath(WIRING_LAYOUT,rotations),true);
  assert.equal(isWiringSolved(WIRING_LAYOUT,rotations),true);

  const connected=connectedFromStart(WIRING_LAYOUT,rotations);
  for(const index of SOLUTION_PATH)assert.equal(connected.has(index),true);
});

test('alternative route does not count unless the six path cells match',()=>{
  const rotations=[...INITIAL_ROTATIONS];
  for(const index of SOLUTION_PATH){
    rotations[index]=WIRING_LAYOUT[index].solution;
  }
  rotations[5]=0;
  assert.equal(matchesDefinedPath(WIRING_LAYOUT,rotations),false);
  assert.equal(isWiringSolved(WIRING_LAYOUT,rotations),false);
});
