import {overlaps} from './world.js?v=20260917-guards-3';

export function getShotOrigin(e,isBoss=false){
 const centerX=e.x+e.w/2;
 if(isBoss)return {x:centerX,y:e.y+38};
 const baseline=e.y+e.h;
 const aimKnown=Number.isFinite(e.aimX)&&e.aimX!==0;
 const facing=aimKnown?(e.aimX<centerX?-1:1):(e.vx<0?-1:1);
 const kind=e.kind||'city';
 const muzzle=kind==='heavy'?{x:58,y:-61}:kind==='sniper'?{x:62,y:-63}:{x:42,y:-60};
 return {x:centerX+facing*muzzle.x,y:baseline+muzzle.y};
}

// Aim is locked at the start of the visible warning, giving the player time to dodge.
export function stepCombat(level,player,shots,dt){
 const events=[];
 const shooters=level.enemies.filter(e=>e.hp>0);
 const boss=level.boss;
 if(boss.hp>0&&player.x>5630&&!boss.active){boss.active=true;events.push('boss');}
 if(boss.active&&boss.hp>0)shooters.push(boss);
 for(const e of shooters){
  const isBoss=e===boss;
  if(Math.abs(e.x-player.x)>(isBoss?1100:530))continue;
  if(e.windup>0){
   e.windup-=dt;
   if(e.windup<=0){
    const origin=getShotOrigin(e,isBoss);
    const angle=Math.atan2(e.aimY-origin.y,e.aimX-origin.x);
    for(const offset of isBoss?[-.16,0,.16]:[0])shots.push({x:origin.x,y:origin.y,w:10,h:7,vx:Math.cos(angle+offset)*(isBoss?270:245),vy:Math.sin(angle+offset)*(isBoss?270:245),life:3.5,boss:isBoss});
    e.fire=isBoss?(e.hp<12?1.05:1.45):1.75;
    events.push('shot');
   }
  }else{
   e.fire-=dt;
   if(e.fire<=0){e.windup=isBoss?.6:.48;e.aimX=player.x+player.w/2;e.aimY=player.y+player.h/2;}
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
