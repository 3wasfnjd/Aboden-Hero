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
  assert.match(stage2,/scene==='rooftop-after'[\s\S]{0,120}rooftop\.canEnterControlRoom\(\)/);
  assert.match(stage2,/function beginChapterEnd\(\)/);
});


test('rooftop ladder is on the left and hero uses the retained multi-frame movement sheet',()=>{
  assert.match(rooftop,/ROOFTOP_LADDER_X=204/);
  assert.match(rooftop,/HERO_WALK_URL='\.\/assets\/aboden-hero-movement\.png'/);
  assert.match(rooftop,/HERO_WALK_FRAMES=Object\.freeze\(\[/);
  assert.match(rooftop,/drawRawSprite\(ctx,heroWalkAsset/);
});

test('rooftop boss difficulty is reduced and hero melee damage is stronger',()=>{
  assert.match(rooftop,/BOSS_MAX_HP=12/);
  assert.match(rooftop,/hitBoss\(3,135,events\)/);
  assert.match(rooftop,/hitBoss\(2,115,events\)/);
});


test('uploaded ladder and six-frame boss walk sheet are integrated into the rooftop finale',()=>{
  assert.match(rooftop,/C73795B9-E427-4AA3-A3DC-B3C990A6B7F4\.png/);
  assert.match(rooftop,/68F8B92C-855E-4303-B55B-4E69B4BDDDE7\.png/);
  assert.match(rooftop,/BOSS_WALK_FRAMES=Object\.freeze\(\[/);
  assert.match(rooftop,/drawSprite\(ctx,bossWalkAsset/);
  assert.match(rooftop,/drawSprite\(ctx,ladderAsset/);
});

test('rooftop fighters stand higher and rain uses layered natural streaks with subtle ripples',()=>{
  assert.match(rooftop,/const FLOOR_Y=984/);
  assert.match(rooftop,/function drawRainLayer\(time/);
  assert.match(rooftop,/count:72,speed:360/);
  assert.match(rooftop,/count:46,speed:575/);
  assert.match(rooftop,/count:20,speed:820/);
  assert.match(rooftop,/ctx\.ellipse\(x,FLOOR_Y\+2/);
});
