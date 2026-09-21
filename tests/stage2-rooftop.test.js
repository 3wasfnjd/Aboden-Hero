import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const stage2=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
const rooftop=readFileSync(new URL('../src/stage2-rooftop.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../stage2.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/stage2.css',import.meta.url),'utf8');

test('floor 6 unlocks a ladder route instead of ending Chapter 2 immediately',()=>{
  const finish=stage2.slice(stage2.indexOf('function finishChallenge('),stage2.indexOf('function arriveNextFloor'));
  assert.match(finish,/floor===FLOOR_COUNT[\s\S]*rooftopUnlocked=true/);
  assert.match(finish,/تم فتح ممر السطح/);
  assert.doesNotMatch(finish,/floor===FLOOR_COUNT[\s\S]{0,220}win\(\)/);
  assert.match(stage2,/function startClimb\(\)/);
  assert.match(stage2,/function enterRooftop\(\)/);
});

test('rooftop battle uses the uploaded background, hero melee sheet and armored boss sheet',()=>{
  assert.match(rooftop,/E254AA9A-004F-4581-B58B-1FF6F0427114\.jpeg/);
  assert.match(rooftop,/B78F8298-AC6E-4984-8171-6060AD95C1AD\.png/);
  assert.match(rooftop,/0D1BD2D4-2C58-41AD-87C6-AF3454DDCD3D\.png/);
  assert.match(rooftop,/climb:\[\[/);
  assert.match(rooftop,/punch1:\[\[/);
  assert.match(rooftop,/heavy:\[\[/);
  assert.match(rooftop,/defeat:\[\[/);
});

test('the final fight is melee-only and exposes a boss HUD',()=>{
  assert.match(stage2,/scene==='rooftop-fight'/);
  assert.match(stage2,/rooftop\.tick\(dt,input\(\)\)/);
  assert.match(html,/id="boss-hud"/);
  assert.match(html,/id="boss-health-fill"/);
  assert.match(css,/body\.rooftop-melee[\s\S]*data-action="shoot"/);
  assert.match(css,/content:"لكمة"/);
  assert.match(css,/content:"قوية"/);
  assert.match(css,/content:"مراوغة"/);
});

test('boss defeat leaves a playable walk to the control room before chapter completion',()=>{
  assert.match(rooftop,/mode='after'/);
  assert.match(rooftop,/function canEnterControlRoom\(\)/);
  assert.match(stage2,/scene==='rooftop-after'&&rooftop\.canEnterControlRoom\(\)/);
  assert.match(stage2,/function beginChapterEnd\(\)/);
});
