import test from 'node:test';
import assert from 'node:assert/strict';
import {createLevel,createPlayer} from '../src/world.js';
import {stepCombat} from '../src/combat.js';
test('guards telegraph and lock aim before shooting',()=>{
 const level=createLevel(),p=createPlayer(650,396),shots=[];
 const e=level.enemies[0];e.fire=0; // enemies[0] is a sniper (.85s windup)
 stepCombat(level,p,shots,1/120);assert(e.windup>0);assert.equal(shots.length,0);const aim=e.aimX;
 p.x+=100;stepCombat(level,p,shots,.2);assert.equal(e.aimX,aim);assert.equal(shots.length,0);
 stepCombat(level,p,shots,.7);assert.equal(shots.length,1);assert(shots[0].vx<0);
});
test('boss wakes at arena approach and sends a three-shot fan plus a rocket',()=>{
 const level=createLevel(),p=createPlayer(5750,396),shots=[];level.enemies=[];
 assert(stepCombat(level,p,shots,.01).includes('boss'));
 level.boss.fire=0;stepCombat(level,p,shots,.01);assert(level.boss.windup>0);
 stepCombat(level,p,shots,.61);assert.equal(shots.length,4);
 const fan=shots.filter(s=>!s.rocket),rockets=shots.filter(s=>s.rocket);
 assert.equal(fan.length,3);assert(new Set(fan.map(s=>s.vy)).size===3);
 assert.equal(rockets.length,1);assert(rockets[0].w>fan[0].w,'rocket is bigger than a regular shot');
});
test('heavy guards burst-fire three shots before cooling down',()=>{
 const level=createLevel(),p=createPlayer(1900,396),shots=[];
 const e=level.enemies.find(x=>x.kind==='heavy');e.fire=0;e.x=1820;
 while(e.windup<=0)stepCombat(level,p,shots,1/120); // reach the windup phase
 while(e.windup>0)stepCombat(level,p,shots,1/120); // finish the telegraph: first shot fires
 assert.equal(shots.length,1);assert(e.burstLeft>0);
 while(e.burstLeft>0)stepCombat(level,p,shots,1/120); // burst gap, then remaining shots
 assert.equal(shots.length,3);
});
