import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyAttackPose,enemyWeaponMuzzle,ENEMY_FLASH_TIME} from '../src/enemy-weapon.js';
import {createLevel,createPlayer} from '../src/world.js';
import {stepCombat} from '../src/combat.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const kind of ['city','heavy','sniper','boss']){
 test(`${kind}: all firing frames and aim frames mirror from the same barrel point`,()=>{
  const boss=kind==='boss';const e={x:800,y:boss?360:408,w:boss?72:34,h:boss?80:32,kind,aimX:100,attackFacing:1};
  for(const state of [{windup:.4,shotFlash:0},{windup:.1,shotFlash:0},...[.2,.14,.09,.04].map(shotFlash=>({windup:0,shotFlash}))]){
   Object.assign(e,state);e.attackFacing=1;const r=enemyAttackPose(e,boss);
   e.attackFacing=-1;const l=enemyAttackPose(e,boss);
   near(r.muzzle.x+l.muzzle.x,2*(e.x+e.w/2));near(r.muzzle.y,l.muzzle.y);
   assert(Number.isFinite(r.muzzle.x)&&Number.isFinite(r.muzzle.y));
   assert(r.muzzle.y<e.y+e.h-25);assert.equal(r.frame,l.frame);
  }
 });
 test(`${kind}: emitted projectile center starts at the rendered fire frame muzzle`,()=>{
  for(const facing of [-1,1]){
   const level=createLevel(),boss=kind==='boss';level.enemies=[];
   const e=boss?level.boss:{...createLevel().enemies[0],kind};
   if(boss)e.active=true;else level.enemies=[e];
   const p=createPlayer(e.x+facing*250,396);
   e.attackFacing=facing;e.aimX=p.x+15;e.aimY=p.y+22;e.windup=1e-7;
   const shots=[],dt=1e-6;stepCombat(level,p,shots,dt);
   const muzzle=enemyWeaponMuzzle(e,boss);assert.equal(e.shotFlash,ENEMY_FLASH_TIME);
   assert.equal(shots.length,boss?4:1); // boss: 3-shot fan + 1 center rocket
   for(const s of shots){near(s.x+s.w/2-s.vx*dt,muzzle.x);near(s.y+s.h/2-s.vy*dt,muzzle.y);assert.equal(Math.sign(s.vx),facing);}
   // Patrol movement must not flip the firing pose after the warning ends.
   e.vx=-facing*48;assert.equal(enemyAttackPose(e,boss).facing,facing);
  }
 });
}
