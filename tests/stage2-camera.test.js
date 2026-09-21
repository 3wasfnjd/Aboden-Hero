import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Chapter 2 intro camera uses one smooth center-space transition',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/const INTRO_DURATION=3\.8/);
  assert.match(js,/const smoother=t=>t\*t\*t/);
  assert.match(js,/function setIntroCamera\(progress\)/);
  assert.match(js,/const startCenter=cameraCenter\(start,FIT_ZOOM\)/);
  assert.match(js,/const endCenter=cameraCenter\(end,GAME_ZOOM\)/);
  assert.doesNotMatch(js,/const hold=\.18/);
  const intro=js.slice(js.indexOf('if(introActive){'),js.indexOf('elapsed+=dt;'));
  assert.doesNotMatch(intro,/followTarget\(cameraZoom\)/);
});
