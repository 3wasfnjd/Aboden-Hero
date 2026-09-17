import {enemyWeaponMuzzle,ENEMY_FLASH_TIME} from './enemy-weapon.js?v=20260917-muzzle-2';
import {overlaps} from './world.js?v=20260917-guards-3';

export const getShotOrigin=enemyWeaponMuzzle;

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
  if(Math.abs(e.x-player.x)>(isBoss?1100:530))continue;
  if(e.windup>0){
   e.windup-=dt;
   if(e.windup<=0){
    e.shotFlash=ENEMY_FLASH_TIME;
    const origin=getMuzzle(e,isBoss);
    const angle=Math.atan2(e.aimY-origin.y,e.aimX-origin.x);
    for(const offset of isBoss?[-.16,0,.16]:[0])shots.push({x:origin.x-5,y:origin.y-3.5,w:10,h:7,vx:Math.cos(angle+offset)*(isBoss?270:245),vy:Math.sin(angle+offset)*(isBoss?270:245),life:3.5,boss:isBoss});
    e.fire=isBoss?(e.hp<12?1.05:1.45):1.75;
    events.push('shot');
   }
  }else{
   e.fire-=dt;
   if(e.fire<=0){e.windup=isBoss?.6:.48;e.aimX=player.x+player.w/2;e.aimY=player.y+player.h/2;e.attackFacing=e.aimX<e.x+e.w/2?-1:1;}
  }
 }
 boss.hit=Math.max(0,boss.hit-dt);
 for(const s of shots){
  s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  if(level.solids.some(p=>overlaps(s,p)))s.life=0;
  if(s.life>0&&overlaps(player,s)){s.life=0;events.push('hit');}
 }
 return events;
}

