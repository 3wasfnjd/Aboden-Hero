import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 uses the uploaded tower background with embedded puzzle controls',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/tower-background-with-puzzles\.png/);
  assert.doesNotMatch(js,/PUZZLE_DEVICE_SOURCES|preparePuzzleDevice|puzzleDeviceArt|drawPuzzleDevice/);
});

test('guards remain visible on all combat floors from the opening tower shot',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/for\(let f=1;f<=FLOOR_COUNT;f\+\+\)/);
  assert.match(js,/else art\.enemy\(\{\.\.\.e,vx:0,windup:0,shotFlash:0,hit:0\},time\)/);
  assert.doesNotMatch(js,/if\(!introActive\)for\(const e of enemies\)/);
});
