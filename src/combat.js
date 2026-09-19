import {enemyWeaponMuzzle,ENEMY_FLASH_TIME,enemyKind} from './enemy-weapon.js?v=20260917-guards-1';
import {overlaps} from './world.js?v=20260919-assets-1';

export const getShotOrigin=enemyWeaponMuzzle;

// Each guard type gets its own rhythm and range instead of an identical single shot:
// city is the baseline; sniper telegraphs longer but hits fast from far away; heavy
// reacts quickly and sprays a short burst of slower, easier-to-read shots.
const KIND_STATS={
 city:{windup:.48,speed:245,cooldown:1.75,range:530,burst:1,burstGap:0},
 sniper:{windup:.85,speed:430,cooldown:2.3,range:720,burst:1,burstGap:0},
 heavy:{windup:.34,speed:190,cooldown:2.1,range:480,burst:3,burstGap:.12}
};

const ROCKET_SPEED=210;

function fireShot(e,isBoss,origin,shots){
 const angle=Math.atan2(e.aimY-origin.y,e.aimX-origin.x);
 for(const offset of isBoss?[-.16,0,.16]:[0]){
  const speed=isBoss?270:KIND_STATS[enemyKind(e)].speed;
  shots.push({x:origin.x-5,y:origin.y-3.5,w:10,h:7,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,life:3.5,boss:isBoss});
 }
 if(isBoss){
  // The gatekeeper's own heavy weapon: one oversized rocket that flies
  // straight at the locked aim point, alongside the fast triple shot.
  shots.push({x:origin.x-9,y:origin.y-6,w:18,h:12,vx:Math.cos(angle)*ROCKET_SPEED,vy:Math.sin(angle)*ROCKET_SPEED,life:3.5,boss:true,rocket:true});
 }
}

// Aim is locked at the start of the visible warning, giving the player time to dodge.
export function stepCombat(level,player,shots,dt,getMuzzle=enemyWeaponMuzzle){
 const events=[];
 const shooters=level.enemies.filter(e=>e.hp>0);
 const boss=level.boss;
 for(const e of [...level.enemies,boss])e.shotFlash=Math.max(0,(e.shotFlash??0)-dt);
 if(boss.hp>0&&player.x>(boss.triggerX??boss.x-500)&&!boss.active){boss.active=true;events.push('boss');}
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
    e.fire=isBoss?(e.hp<boss.maxHP/2?1.05:1.45):(e.burstLeft>0?e.burstGap:stats.cooldown);
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
  s.x+=s.vx*dt;s.y+=s.vy*dt;
  s.life-=dt;
  if(s.life>0&&overlaps(player,s)){s.life=0;events.push('hit');}
 }
 return events;
}

