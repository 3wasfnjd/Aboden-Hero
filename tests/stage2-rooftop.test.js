import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const stage2=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
const rooftop=readFileSync(new URL('../src/stage2-rooftop.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../stage2.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/stage2.css',import.meta.url),'utf8');

test('floor 6 unlocks a ladder route instead of ending Chapter 2 immediately',()=>{
  const finish=stage2.slice(stage2.indexOf('function finishChallenge('),stage2.indexOf('function startClimb'));
  assert.match(finish,/floor===FLOOR_COUNT[\s\S]*rooftopUnlocked=true/);
  assert.match(finish,/تم فتح ممر السطح/);
  assert.doesNotMatch(finish,/floor===FLOOR_COUNT[\s\S]{0,220}win\(\)/);
  assert.match(stage2,/function startClimb\(\)/);
  assert.match(stage2,/function enterRooftop\(\)/);
});

test('rooftop battle uses the new high quality hero and boss animation pack',()=>{
  assert.match(rooftop,/E254AA9A-004F-4581-B58B-1FF6F0427114\.jpeg/);
  assert.match(rooftop,/28C8741E-FF4D-4642-9B2D-F77236FFA97F\.png/);
  assert.match(rooftop,/3E73BF27-069C-4E22-A80D-737550CFA7B9\.png/);
  assert.match(rooftop,/159DD9FD-ADB2-448C-98FD-CD14991E4FE2\.png/);
  assert.match(rooftop,/100882C5-14DA-4017-891C-7CDA8F39F084\.png/);
  assert.match(rooftop,/091AAB6A-F854-4477-8752-D1B58381AA37\.png/);
  assert.match(rooftop,/04C075DB-907D-4B1D-95AF-0DC90C81107A\.png/);
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
  assert.match(rooftop,/FLOSS_POSES=Object\.freeze/);
  assert.match(rooftop,/mode='dance'/);
  assert.match(rooftop,/events\.push\('dance-start'\)/);
  assert.match(rooftop,/events\.push\('dance-finished'\)/);
  assert.match(rooftop,/bossVisible=mode!=='dance'&&mode!=='complete'/);
  assert.match(stage2,/scene='rooftop-dance'/);
  assert.match(stage2,/dance-finished'\)\{win\(\);return;/);
  assert.doesNotMatch(stage2,/ادخل غرفة التحكم|beginChapterEnd|canEnterControlRoom/);
});


test('rooftop ladder stays on the left and combat walking uses a real multi-frame cycle',()=>{
  assert.match(rooftop,/ROOFTOP_LADDER_X=204/);
  assert.match(rooftop,/77A34199-B559-4A99-8683-92889A35586F\.png/);
  assert.match(rooftop,/HERO_WALK_URL='\.\/assets\/aboden-hero-movement\.png'/);
  assert.match(rooftop,/HERO_WALK_FRAMES=Object\.freeze/);
  assert.match(rooftop,/drawRawSprite\(ctx,heroWalkAsset,frame,hero\.x,FLOOR_Y,facing,frame\[3\]\*walkScale\)/);
});

test('rooftop boss difficulty is reduced and hero melee damage is stronger',()=>{
  assert.match(rooftop,/BOSS_MAX_HP=12/);
  assert.match(rooftop,/hitBoss\(3,135,events\)/);
  assert.match(rooftop,/hitBoss\(2,115,events\)/);
});


test('uploaded ladder and normalized high quality boss animations are integrated',()=>{
  assert.match(rooftop,/C73795B9-E427-4AA3-A3DC-B3C990A6B7F4\.png/);
  assert.match(rooftop,/BOSS_ANIMS=Object\.freeze/);
  assert.match(rooftop,/BOSS_VISUAL_H=232/);
  assert.match(rooftop,/drawFrameSet\(ctx,bossAssets\[state\]/);
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


test('Chapter 2 keeps Stage 1 framed UI assets with new full-body hero rendering',()=>{
  assert.match(rooftop,/HERO_MELEE_POSES=Object\.freeze/);
  assert.match(rooftop,/drawBoundedAsset\(ctx,entry/);
  assert.match(html,/class="health" id="health-panel"/);
  assert.match(css,/assets\/ui\/hud\/health\.png/);
  assert.match(css,/assets\/ui\/hud\/area\.png/);
  assert.match(css,/assets\/ui\/toast-frame\.png/);
});


test('Floss uses two complete uploaded poses at the same visual height as the rooftop hero',()=>{
  assert.match(rooftop,/0525AB5D-6007-49F8-8DA2-F7BB8E22D605\.png/);
  assert.match(rooftop,/A3B1ACCB-271B-42D1-9AC7-94E9E4CF491B\.png/);
  assert.match(rooftop,/FLOSS_VISUAL_H=188/);
  assert.match(rooftop,/bounds:\[176,44,976,1404\]/);
  assert.match(rooftop,/bounds:\[264,20,1048,1420\]/);
  assert.match(rooftop,/drawBoundedAsset\(ctx,flossPoses\[index\],hero\.x,FLOOR_Y,1,FLOSS_VISUAL_H\)/);
  assert.doesNotMatch(rooftop,/FLOSS_FRAME_W|FLOSS_FRAME_H|FLOSS_FRAMES/);
  assert.match(stage2,/scene==='rooftop-dance'/);
});


test('all eight new rooftop boss actions have dedicated assets and one locked visual height',()=>{
  for(const id of [
    '04C075DB-907D-4B1D-95AF-0DC90C81107A',
    '091AAB6A-F854-4477-8752-D1B58381AA37',
    '100882C5-14DA-4017-891C-7CDA8F39F084',
    '142AAECF-81A4-4CD9-85F3-8D59EBB3F55B',
    '1D5689D4-376E-410B-8596-22D02BC68210',
    'A2B6AA2C-3A8F-4CBD-9B30-BDF320327968',
    'C935CA0B-5C44-45C4-A29B-1BBA10D4BDA1',
    'EC12F7F5-4E9E-42B5-B806-48372F81AA5C'
  ])assert.match(rooftop,new RegExp(id));
  assert.match(rooftop,/BOSS_VISUAL_H=232/);
});


test('boss actions use measured alpha crops with per-sheet source calibration',()=>{
  for(const token of ['defeat:{refH:397','walk:{refH:485','idle:{refH:600','hurt:{refH:639','heavy:{refH:531','attack1:{refH:488','block:{refH:608','attack2:{refH:466']){
    assert.ok(rooftop.includes(token),token);
  }
  assert.match(rooftop,/\[44,83,517,681\]/);
  assert.match(rooftop,/\[22,161,362,637\]/);
});


test('rooftop hero action crops keep feet anchored and dodge stays crouched',()=>{
  assert.match(rooftop,/\[226,44,1083,1224\]/);
  assert.match(rooftop,/\[28,84,1241,1206\]/);
  assert.match(rooftop,/\[15,291,1244,1026\]/);
  assert.match(rooftop,/const visualH=state==='dodge'\?118:188/);
  assert.match(rooftop,/const walkScale=188\/307/);
});
