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
  assert.match(css,/assets\/ui\/hud\/boss\.png/);
  assert.match(css,/assets\/ui\/buttons\/shoot\.png/);
  assert.match(css,/assets\/ui\/buttons\/jump\.png/);
  assert.match(css,/assets\/ui\/buttons\/dash\.png/);
});

test('boss defeat removes the boss, runs a scripted Floss victory dance, then completes Chapter 2',()=>{
  assert.match(rooftop,/FLOSS_DURATION=5\.8/);
  assert.match(rooftop,/FLOSS_FRAMES=Object\.freeze/);
  assert.match(rooftop,/mode='dance'/);
  assert.match(rooftop,/events\.push\('dance-start'\)/);
  assert.match(rooftop,/events\.push\('dance-finished'\)/);
  assert.match(rooftop,/bossVisible=mode!=='dance'&&mode!=='complete'/);
  assert.match(stage2,/scene='rooftop-dance'/);
  assert.match(stage2,/dance-finished'\)\{win\(\);return;/);
  assert.doesNotMatch(stage2,/ادخل غرفة التحكم|beginChapterEnd|canEnterControlRoom/);
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
  assert.match(rooftop,/BOSS_VISUAL_H=232/);
  assert.match(rooftop,/const displayH=184/);
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


test('hero victory frame keeps the full head and Chapter 2 uses Stage 1 framed UI assets',()=>{
  assert.match(rooftop,/win:\[\[1152,683,362,329\]\]/);
  assert.match(html,/class="health" id="health-panel"/);
  assert.match(css,/assets\/ui\/hud\/health\.png/);
  assert.match(css,/assets\/ui\/hud\/area\.png/);
  assert.match(css,/assets\/ui\/toast-frame\.png/);
});


test('Floss animation uses the two uploaded four-frame dance sheets and locks controls while dancing',()=>{
  assert.match(rooftop,/0525AB5D-6007-49F8-8DA2-F7BB8E22D605\.png/);
  assert.match(rooftop,/A3B1ACCB-271B-42D1-9AC7-94E9E4CF491B\.png/);
  assert.match(rooftop,/FLOSS_FRAME_W=543/);
  assert.match(rooftop,/FLOSS_FRAME_H=724/);
  assert.match(rooftop,/FLOSS_FRAMES=Object\.freeze/);
  assert.match(rooftop,/const index=Math\.floor\(timer\*7\)%FLOSS_FRAMES\.length/);
  assert.match(rooftop,/drawRawSprite\(ctx,asset,pose\.frame,hero\.x,FLOOR_Y\+bounce,1,205\)/);
  assert.doesNotMatch(rooftop,/frame:'punch1'|frame:'block'|frame:'heavy'|frame:'dodge'/);
  assert.match(stage2,/scene==='rooftop-dance'/);
  assert.match(html,/زعيم \+ Floss/);
});
