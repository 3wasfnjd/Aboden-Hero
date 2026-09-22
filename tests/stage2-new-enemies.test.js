import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FLOOR_DEFS} from '../src/stage2-state.js';
import {bulletTargetBounds,enemyDisplayHeight} from '../src/hero-weapon.js';
import {fallbackEnemyMuzzle,hitsShieldFromFront} from '../src/enemy-weapon.js';

const stage2=readFileSync(new URL('../src/stage2.js',import.meta.url),'utf8');
const art=readFileSync(new URL('../src/art.js',import.meta.url),'utf8');
const combat=readFileSync(new URL('../src/combat.js',import.meta.url),'utf8');

test('Chapter 2 uses only drones on floors 1 and 5 and two shield guards on floor 3',()=>{
  assert.deepEqual(FLOOR_DEFS[1].enemies,['drone','drone']);
  assert.deepEqual(FLOOR_DEFS[3].enemies,['newguard','newguard']);
  assert.deepEqual(FLOOR_DEFS[5].enemies,['drone','drone']);
});

test('shield guard uses the complete new animation pack while drone assets stay unchanged',()=>{
  for(const id of [
    '979836E9-6441-4AD5-9AAB-301DEDDA3F08',
    '7FDACB48-1789-4A22-9EBC-8BE321E13B4D',
    '467F9C1F-30BE-4274-953A-E6CF9ADC358B',
    '06266B22-0894-489A-9711-B79239B1A128',
    '33329A1A-C050-441E-9D23-C85EEDBCFD88',
    '9F2B5146-8350-45D9-86C0-A7E3A03FD43F',
    '799F6394-1C8A-431B-9BCD-12EE63BAFE65'
  ])assert.match(art,new RegExp(id));
  assert.match(art,/CE321790-436E-4BF6-BF00-23D8E11F8635\.png/);
  assert.match(art,/152AB8BD-FD1C-44F8-BCBD-D043437BC255\.png/);
  assert.match(art,/type==='drone'\)\{drawDrone\(e,time\);return;\}/);
  assert.match(art,/type==='newguard'\)\{drawNewGuard\(e,time\);return;\}/);
});

test('drones hover, move and have their own shooting rhythm',()=>{
  assert.match(stage2,/e\.kind==='drone'\)e\.y=e\.hoverY\+Math\.sin/);
  assert.match(stage2,/isDrone\?g-82:g-32/);
  assert.match(combat,/drone:\{windup:\.40,speed:285,cooldown:1\.90,range:610/);
  const drone={x:500,y:800,w:48,h:46,kind:'drone',aimX:300};
  assert.equal(enemyDisplayHeight(drone),82);
  const box=bulletTargetBounds(drone);
  assert.ok(box.y<drone.y&&box.h>drone.h);
  assert.ok(fallbackEnemyMuzzle(drone,0,false).y>drone.y);
});

test('new guard shield blocks frontal bullets and accepts rear hits',()=>{
  const rightFacing={kind:'newguard',vx:48,windup:0,shotFlash:0};
  assert.equal(hitsShieldFromFront(rightFacing,-620),true);
  assert.equal(hitsShieldFromFront(rightFacing,620),false);
  const leftFacing={kind:'newguard',vx:-48,windup:0,shotFlash:0};
  assert.equal(hitsShieldFromFront(leftFacing,620),true);
  assert.equal(hitsShieldFromFront(leftFacing,-620),false);
  assert.match(stage2,/hitsShieldFromFront\(e,b\.vx\)/);
  assert.match(stage2,/e\.shieldFlash=\.18/);
  assert.match(art,/else if\(e\.shieldFlash>0\)\{\s*state='block'/);
});


test('new shield guard uses measured per-action frame boxes and a visible defeat animation',()=>{
  assert.match(art,/NEW_GUARD_ANIMS=Object\.freeze/);
  assert.match(art,/state='defeat'/);
  assert.match(art,/drawFrameSet\(ctx,newGuardAssets\[state\]/);
  assert.match(stage2,/time-e\.deathAt<\.90/);
});


test('tower hero uses real multi-frame locomotion and HQ uploaded action poses',()=>{
  assert.match(art,/MOVEMENT_URL='\.\/assets\/aboden-hero-movement\.png'/);
  assert.match(art,/MOVE_FRAMES=Object\.freeze/);
  assert.match(art,/MOVE_FRAMES\.run\[i\]/);
  assert.match(art,/MOVE_FRAMES\.jump/);
  assert.match(art,/MOVE_FRAMES\.fall/);
  for(const id of [
    'A683D766-579C-4F78-9DF1-425E03CAACED',
    '50B3B697-BC29-4C39-8278-49C7AE643BC7',
    'E1490764-AF8C-4DE7-8182-3895BB2E1BDE',
    'EDFA0F7E-8277-4744-A1D8-83A77E114397',
    '07D8F9F6-4DE1-48F5-A2AB-58E5A204DE56',
    'ABC893E7-6718-4006-8568-4B74BABAFDC1',
    'CB6B8417-8564-4F27-BFEB-8DB12889CF23',
    '81AF200A-886A-4CA2-A2DF-8F7E0FD7A6CF'
  ])assert.match(art,new RegExp(id));
  assert.doesNotMatch(art,/run:\[\['\.\/assets\/stage2\/rooftop\/FCEC/);
  assert.doesNotMatch(art,/jump:\[\['\.\/assets\/stage2\/rooftop\/3F996/);
  assert.doesNotMatch(art,/fall:\[\['\.\/assets\/stage2\/rooftop\/D6AF/);
});


test('shield guard uses alpha-cropped per-sheet scale and freezes during combat poses',()=>{
  assert.match(art,/idle:\{refH:514/);
  assert.match(art,/walk:\{refH:520/);
  assert.match(art,/aim:\{refH:543/);
  assert.match(art,/fire:\{refH:453/);
  assert.match(art,/hurt:\{refH:523/);
  assert.match(art,/defeat:\{refH:330/);
  assert.match(stage2,/const locked=e\.windup>0\|\|e\.shotFlash>0\|\|e\.hit>0\|\|\(e\.shieldFlash\?\?0\)>0/);
  assert.match(stage2,/if\(!locked\)e\.x\+=e\.vx\*dt/);
});


test('tower hero HQ poses use measured alpha crop bounds',()=>{
  assert.match(art,/\[365,179,911,1119\]/);
  assert.match(art,/\[234,195,1135,1111\]/);
  assert.match(art,/\[185,50,1121,1201\]/);
  assert.match(art,/const frame=frames\[i\],moveScale=82\/307/);
});
