import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 uses the uploaded tower background with embedded puzzle controls',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/tower-background-with-puzzles\.png/);
  assert.doesNotMatch(js,/PUZZLE_DEVICE_SOURCES|preparePuzzleDevice|puzzleDeviceArt|drawPuzzleDevice/);
});

test('guards on every combat floor are live from the start instead of waiting for floor arrival',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/function tickEnemyPatrol\(dt\)/);
  assert.match(js,/tickEnemyPatrol\(dt\);[\s\S]*if\(introActive\)/);
  const draw=js.slice(js.indexOf('function drawWorld()'),js.indexOf('function draw(){'));
  assert.match(draw,/for\(let f=1;f<=FLOOR_COUNT;f\+\+\)/);
  assert.match(draw,/art\.enemy\(e,time\)/);
  assert.doesNotMatch(draw,/\.\.\.e,vx:0,windup:0,shotFlash:0,hit:0/);
});

test('puzzle interaction follows the player physical floor, not currentFloor activation',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  const interaction=js.slice(js.indexOf('function currentPuzzleInteraction()'),js.indexOf('function updateAction()'));
  assert.match(interaction,/const floor=playerFloor\(\)/);
  assert.doesNotMatch(interaction,/progress\.currentFloor/);
  const open=js.slice(js.indexOf('function openPuzzle('),js.indexOf('function closePuzzle()'));
  assert.match(open,/function openPuzzle\(floor=playerFloor\(\)\)/);
  assert.doesNotMatch(open,/progress\.currentFloor/);
});
