import {enemyWeaponMuzzle,ENEMY_FLASH_TIME,enemyKind} from './enemy-weapon.js?v=20260917-guards-1';
import {overlaps} from './world.js?v=20260917-guards-3';

export const getShotOrigin=enemyWeaponMuzzle;

// Each guard type gets its own rhythm and range instead of an identical single shot:
// city is the baseline; sniper telegraphs longer but hits fast from far away; heavy
// reacts quickly and sprays a short burst of slower, easier-to-read shots.
const KIND_STATS={
 city:{windup:.48,speed:245,cooldown:1.75,range:530,burst:1,burstGap:0},
 sniper:{windup:.85,speed:430,cooldown:2.3,range:720,burst:1,burstGap:0},
 heavy:{windup:.34,speed:190,cooldown:2.1,range:480,burst:3,burstGap:.12}
};

const ROCKET_DURATION=1.6,ROCKET_LOOPS=1;

function fireShot(e,isBoss,origin,shots){
 const angle=Math.atan2(e.aimY-origin.y,e.aimX-origin.x);
 for(const offset of isBoss?[-.16,0,.16]:[0]){
  const speed=isBoss?270:KIND_STATS[enemyKind(e)].speed;
  shots.push({x:origin.x-5,y:origin.y-3.5,w:10,h:7,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,life:3.5,boss:isBoss});
 }
 if(isBoss){
  // The gatekeeper's own heavy weapon: one oversized rocket that spirals out
  // from the muzzle and tightens onto the locked aim point, alongside the fast
  // triple shot. Position is driven parametrically (see updateRocket), not by
  // a fixed velocity.
  const dist=Math.hypot(e.aimX-origin.x,e.aimY-origin.y);
  shots.push({
   x:origin.x-9,y:origin.y-6,w:18,h:12,vx:0,vy:0,life:ROCKET_DURATION,boss:true,rocket:true,
   launchX:origin.x,launchY:origin.y,targetX:e.aimX,targetY:e.aimY,
   age:0,duration:ROCKET_DURATION,loopRadius:Math.min(220,Math.max(70,dist*.32))
  });
 }
}

// The rocket's center travels straight from launch to the locked target while
// swinging out to the side and back on top of that line. The swing is scaled
// by an envelope that is exactly 0 at both ends, so the rocket starts right
// at the muzzle and lands exactly on the target, looping wide in between.
function updateRocket(s,dt){
 const prevCx=s.x+s.w/2,prevCy=s.y+s.h/2;
 s.age+=dt;
 const t=Math.min(1,s.age/s.duration);
 // Smoothstep easing: eases in and out instead of moving at a constant rate,
 // so the rocket reads as accelerating/decelerating naturally.
 const progress=t*t*(3-2*t);
 const dx=s.targetX-s.launchX,dy=s.targetY-s.launchY;
 const dist=Math.hypot(dx,dy)||1;
 const dirX=dx/dist,dirY=dy/dist,perpX=-dirY,perpY=dirX;
 const baseX=s.launchX+dx*progress,baseY=s.launchY+dy*progress;
 // The rocket completes its single loop in the first half of the flight
 // (bulging off the direct line and back onto it), then dives straight at
 // the target for the second half, matching the reference sketch.
 const loopT=Math.min(1,progress/.5);
 const envelope=Math.sin(Math.PI*loopT);
 const angle=loopT*ROCKET_LOOPS*Math.PI*2;
 const offAlong=s.loopRadius*envelope*Math.cos(angle);
 const offAcross=s.loopRadius*envelope*Math.sin(angle);
 const cx=baseX+dirX*offAlong+perpX*offAcross;
 const cy=baseY+dirY*offAlong+perpY*offAcross;
 s.x=cx-s.w/2;s.y=cy-s.h/2;
 s.vx=(cx-prevCx)/dt;s.vy=(cy-prevCy)/dt;
 s.angle=Math.atan2(s.vy,s.vx);
}

// Aim is locked at the start of the visible warning, giving the player time to dodge.
export function stepCombat(level,player,shots,dt,getMuzzle=enemyWeaponMuzzle){
 const events=[];
 const shooters=level.enemies.filter(e=>e.hp>0);
 const boss=level.boss;
 for(const e of [...level.enemies,boss])e.shotFlash=Math.max(0,(e.shotFlash??0)-dt);
 if(boss.hp>0&&player.x>5630&&!boss.active){boss.active=true;events.push('boss');}
 if(boss.active&&boss.hp>0)shooters.push(boss);
 for(const e of shooters){
  const isBoss=e===boss;
  const stats=isBoss?null:KIND_STATS[enemyKind(e)];
  if(Math.abs(e.x-player.x)>(isBoss?1100:stats.range))continue;
  if(e.windup>0){
   e.windup-=dt;
   if(e.windup<=0){
    e.shotFlash=ENEMY_FLASH_TIME;
    fireShot(e,isBoss,getMuzzle(e,isBoss),shots);
    e.burstLeft=isBoss?0:stats.burst-1;
    e.burstGap=isBoss?0:stats.burstGap;
    e.fire=isBoss?(e.hp<12?1.05:1.45):(e.burstLeft>0?e.burstGap:stats.cooldown);
    events.push('shot');
   }
  }else if(e.burstLeft>0){
   e.fire-=dt;
   if(e.fire<=0){
    e.shotFlash=ENEMY_FLASH_TIME;
    fireShot(e,isBoss,getMuzzle(e,isBoss),shots);
    e.burstLeft--;
    e.fire=e.burstLeft>0?e.burstGap:stats.cooldown;
    events.push('shot');
   }
  }else{
   e.fire-=dt;
   if(e.fire<=0){e.windup=isBoss?.6:stats.windup;e.windupDuration=e.windup;e.aimX=player.x+player.w/2;e.aimY=player.y+player.h/2;e.attackFacing=e.aimX<e.x+e.w/2?-1:1;}
  }
 }
 boss.hit=Math.max(0,boss.hit-dt);
 for(const s of shots){
  if(s.rocket)updateRocket(s,dt);
  else{s.x+=s.vx*dt;s.y+=s.vy*dt;}
  s.life-=dt;
  if(s.life>0&&overlaps(player,s)){s.life=0;events.push('hit');}
 }
 return events;
}

