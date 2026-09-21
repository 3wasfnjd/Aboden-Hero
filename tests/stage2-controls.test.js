import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 uses Stage 1 left/right button controls instead of a joystick',()=>{
  const html=readFileSync(new URL('../stage2.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(html,/data-action="left"/);
  assert.match(html,/data-action="right"/);
  assert.doesNotMatch(html,/move-stick/);
  assert.doesNotMatch(js,/stickPointerId|stickX|moveStickBase/);
  assert.match(js,/activeTouch\('left'\)/);
  assert.match(js,/activeTouch\('right'\)/);
});

test('Chapter 2 leaves puzzle-device artwork out of the tower until the background is redesigned',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  const world=js.slice(js.indexOf('function drawWorld()'),js.indexOf('function draw(){'));
  assert.doesNotMatch(world,/drawPuzzleDevice\(floor\)/);
});
