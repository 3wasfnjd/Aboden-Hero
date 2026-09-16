import test from 'node:test';
import assert from 'node:assert/strict';
import {createLevel,createPlayer} from '../src/world.js';
import {stepCombat} from '../src/combat.js';
test('guards telegraph and lock aim before shooting',()=>{
 const level=createLevel(),p=createPlayer(650,396),shots=[];
 const e=level.enemies[0];e.fire=0;
 stepCombat(level,p,shots,1/120);assert(e.windup>0);assert.equal(shots.length,0);const aim=e.aimX;
 p.x+=100;stepCombat(level,p,shots,.2);assert.equal(e.aimX,aim);assert.equal(shots.length,0);
 stepCombat(level,p,shots,.29);assert.equal(shots.length,1);assert(shots[0].vx<0);
});
test('boss wakes at arena approach and sends a three-shot fan',()=>{
 const level=createLevel(),p=createPlayer(5750,396),shots=[];level.enemies=[];
 assert(stepCombat(level,p,shots,.01).includes('boss'));
 level.boss.fire=0;stepCombat(level,p,shots,.01);assert(level.boss.windup>0);
 stepCombat(level,p,shots,.61);assert.equal(shots.length,3);assert(new Set(shots.map(s=>s.vy)).size===3);
});
