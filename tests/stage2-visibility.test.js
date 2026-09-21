import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 keeps puzzles and guards visible from the opening tower shot',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.doesNotMatch(js,/def\.type!=='puzzle'\|\|!progress\.floors\[floor\]\.unlocked/);
  assert.match(js,/ctx\.globalAlpha=complete \? \.78 : unlocked \? 1 : \.72/);
  assert.match(js,/for\(let f=1;f<=FLOOR_COUNT;f\+\+\)/);
  assert.match(js,/else art\.enemy\(\{\.\.\.e,vx:0,windup:0,shotFlash:0,hit:0\},time\)/);
  assert.doesNotMatch(js,/if\(!introActive\)for\(const e of enemies\)/);
});
