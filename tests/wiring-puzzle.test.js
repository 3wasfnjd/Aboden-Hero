import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIRING_LAYOUT,INITIAL_ROTATIONS,portsFor,isWiringSolved,connectedFromStart
} from '../puzzle-kit/wiring/wiring-logic.js';

test('pipe rotations map to expected ports',()=>{
  assert.deepEqual(portsFor('straight',0),['N','S']);
  assert.deepEqual(portsFor('straight',1),['E','W']);
  assert.deepEqual(portsFor('elbow',2),['S','W']);
  assert.deepEqual(portsFor('tee',0),['N','E','W']);
});

test('initial wiring layout is not solved',()=>{
  assert.equal(isWiringSolved(WIRING_LAYOUT,[...INITIAL_ROTATIONS]),false);
});

test('documented solution connects START to END',()=>{
  const rotations=WIRING_LAYOUT.map(tile=>tile.solution);
  assert.equal(isWiringSolved(WIRING_LAYOUT,rotations),true);
  const connected=connectedFromStart(WIRING_LAYOUT,rotations);
  assert.equal(connected.has(0),true);
  assert.equal(connected.has(11),true);
});
