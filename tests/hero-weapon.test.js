import test from 'node:test';
import assert from 'node:assert/strict';
import {heroFirePose,makeHeroBullet,fallbackMuzzle,bulletTargetBounds} from '../src/hero-weapon.js';
import {createPlayer,overlaps} from '../src/world.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('first firing frame is anchored to the measured barrel at atlas 338,624',()=>{
 const p=createPlayer(100,396);p.shot=.14;
 const pose=heroFirePose(p);assert.equal(pose.index,0);
 near(pose.muzzle.x,100+15+(338-173-84)*82/180);
 near(pose.muzzle.y,440+(624-593-180)*82/180);
});
test('all four firing frames mirror around the body center without changing height',()=>{
 for(const shot of [.14,.10,.07,.03]){
  const p=createPlayer(200,270);p.shot=shot;
  const right=heroFirePose(p);p.facing=-1;const left=heroFirePose(p);
  near(left.muzzle.x+right.muzzle.x,2*(p.x+p.w/2));near(left.muzzle.y,right.muzzle.y);
  const b=makeHeroBullet(left.muzzle,-1);near(b.x+b.w/2,left.muzzle.x);near(b.y+b.h/2,left.muzzle.y);assert(b.vx<0);
 }
});
test('jump, dash and hit states keep the firing pose at the current feet position',()=>{
 const p=createPlayer(90,396);p.shot=.14;const ground=heroFirePose(p).muzzle;
 p.y-=100;p.grounded=false;p.dashTime=.1;p.invulnerable=1.3;
 const airborne=heroFirePose(p).muzzle;near(airborne.x,ground.x);near(airborne.y,ground.y-100);
});
test('fallback muzzle includes procedural bob and dash lean in both directions',()=>{
 const p=createPlayer();p.grounded=true;p.vx=120;p.dashTime=.1;
 const a=fallbackMuzzle(p,.2);p.facing=-1;const b=fallbackMuzzle(p,.2);
 near(a.x+b.x,2*(p.x+p.w/2));near(a.y,b.y);
});
test('bullets at corrected muzzle height hit visible guard heads and torsos',()=>{
 const p=createPlayer(100,396);p.shot=.14;const bullet=makeHeroBullet(heroFirePose(p).muzzle,1);
 for(const kind of ['city','heavy','sniper']){
  const e={x:bullet.x,y:408,w:34,h:32,kind};
  assert(overlaps(bullet,bulletTargetBounds(e)),kind);
  assert(!overlaps(bullet,e),'old short body would miss');
 }
});
