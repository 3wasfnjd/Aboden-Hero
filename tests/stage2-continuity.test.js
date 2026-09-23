import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('all five floor elevators exist and run without challenge gates',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/Array\.from\(\{length:FLOOR_COUNT-1\}/);
  assert.match(js,/function tickElevators\(dt\)/);
  assert.match(js,/for\(const elevator of elevators\)\{/);
  assert.doesNotMatch(js,/beginElevator|canUseElevator|elevatorReady|activateAutoElevator/);
});


test('Chapter 2 uses a persistent Stage 1-style area strip and no puzzle-device overlays are drawn',()=>{
  const html=readFileSync(new URL('../stage2.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/stage2.css',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(html,/id="area-strip"/);
  assert.match(html,/id="area-name"/);
  assert.match(html,/id="area-progress"/);
  assert.match(css,/assets\/ui\/hud\/area\.png/);
  assert.doesNotMatch(js.slice(js.indexOf('function drawWorld()'),js.indexOf('function draw(){')),/drawPuzzleDevice/);
});

test('guard attack rendering always uses a full-body idle frame',()=>{
  const art=readFileSync(new URL('../src/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function enemy(e,time)');
  const end=art.indexOf('function boss',start);
  const enemy=art.slice(start,end);
  assert.match(enemy,/if\(attack\)[\s\S]*scaledFrames\(frames\.idle/);
  assert.doesNotMatch(enemy,/scaledFrames\(\[attack\.frame\]/);
});


test('riding an elevator is exempt from the floor fall-respawn guard',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  assert.match(js,/function playerRidingElevator\(\)/);
  assert.match(js,/elevators\.some\(elevator=>playerOnElevator\(elevator,elevator\.y\)\)/);
  assert.match(js,/if\(!playerRidingElevator\(\)&&player\.y>groundY\(progress\.currentFloor\)\+150\)/);
});
