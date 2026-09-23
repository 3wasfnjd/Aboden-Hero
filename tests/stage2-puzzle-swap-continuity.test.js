import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FLOOR_DEFS} from '../src/stage2-state.js';

test('floor 2 and floor 4 puzzle types match the embedded control devices',()=>{
  assert.equal(FLOOR_DEFS[2].puzzle,'wiring');
  assert.equal(FLOOR_DEFS[4].puzzle,'match');
  assert.equal(FLOOR_DEFS[6].puzzle,'cubes');
});

test('floor arrival keeps the same player object but anchors it to the correct elevator landing',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  const start=js.indexOf('function arriveNextFloor(){');
  const end=js.indexOf('function tickCombat',start);
  const block=js.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(block,/createPlayer\(/);
  assert.match(block,/player\.x=arrivalXForFloor\(floor,player\.w\)/);
  assert.match(block,/player\.y=gy-player\.h/);
});
