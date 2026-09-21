import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 touch controls keep Stage 1 left-to-right order inside Arabic UI',()=>{
  const css=readFileSync(new URL('../src/stage2.css',import.meta.url),'utf8');
  const html=readFileSync(new URL('../stage2.html',import.meta.url),'utf8');
  assert.match(html,/data-action="left"[\s\S]*data-action="right"/);
  assert.match(css,/#controls\{[\s\S]*?direction:ltr!important/);
  assert.match(css,/#controls>div\{[\s\S]*?direction:ltr!important[\s\S]*?flex-direction:row!important/);
});
