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

test('Chapter 2 puzzle devices are rendered as compact wall controls',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/PUZZLE_DEVICE_H=96/);
  assert.match(js,/PUZZLE_DEVICE_CROP=\.60/);
  assert.match(js,/groundY\(floor\)-dh-28/);
});
