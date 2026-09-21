import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('floor arrival keeps the player continuous on the elevator instead of respawning them',()=>{
  const js=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
  const start=js.indexOf('function arriveNextFloor(){');
  const end=js.indexOf('function startClimb',start);
  const arrive=js.slice(start,end);
  assert.match(arrive,/player\.y\+=gy-previousY/);
  assert.match(arrive,/elevatorDockFloor=floor/);
  assert.doesNotMatch(arrive,/player\.x=/);
  assert.doesNotMatch(arrive,/cameraX=target\.x/);
  assert.doesNotMatch(arrive,/toast\(/);
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
