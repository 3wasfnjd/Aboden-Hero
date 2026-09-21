import {BOSS_FRAMES,CITY_FRAMES,HEAVY_FRAMES,SNIPER_FRAMES,enemyKind,enemyFacing,enemyAttackPose,fallbackEnemyMuzzle} from './enemy-weapon.js?v=20260921-shield-guard-2';
import {enemyDisplayHeight} from './hero-weapon.js?v=20260921-stage2-new-enemies-1';
import {createArt as createBaseArt} from './art-base.js?v=20260921-cleanup-1';

const MOVEMENT_URL='./assets/aboden-hero-movement.png';
const BOSS_URL='./assets/Gatekeeper.png';
const CITY_URL='./assets/City_Guard.png';
const HEAVY_URL='./assets/Heavy_Guard.png';
const SNIPER_URL='./assets/Sniper_Rooftop_Guard.png';
const NEW_GUARD_URL='./assets/stage2/rooftop/712D453B-A752-4A91-BB87-AE9554BBF4FA.png';
const DRONE_IDLE_URL='./assets/stage2/rooftop/CE321790-436E-4BF6-BF00-23D8E11F8635.png';
const DRONE_ATTACK_URL='./assets/stage2/rooftop/152AB8BD-FD1C-44F8-BCBD-D043437BC255.png';
const ROCKET_URL='./assets/ui/rocket.png';
const HERO_BULLET_URL='./assets/ui/projectiles/bullet-hero.png';
const ENEMY_BULLET_URL='./assets/ui/projectiles/bullet-red2.png';
const ROCKET_SMOKE_URL='./assets/ui/projectiles/rocket-smoke.png';
const ENERGY_CRYSTAL_URL='./assets/ui/items/energy-crystal.png';
const HEALTH_CROSS_URL='./assets/ui/items/health-cross.png';

function loadImage(url){
 const img=new Image();
 img.decoding='async';
 const state={img,ready:false};
 img.addEventListener('load',()=>{state.ready=true;});
 img.src=url;
 return state;
}

const movementAsset=loadImage(MOVEMENT_URL);
const bossAsset=loadImage(BOSS_URL);
const cityAsset=loadImage(CITY_URL);
const heavyAsset=loadImage(HEAVY_URL);
const sniperAsset=loadImage(SNIPER_URL);
const newGuardAsset=loadImage(NEW_GUARD_URL);
const droneIdleAsset=loadImage(DRONE_IDLE_URL);
const droneAttackAsset=loadImage(DRONE_ATTACK_URL);
const rocketAsset=loadImage(ROCKET_URL);
const heroBulletAsset=loadImage(HERO_BULLET_URL);
const enemyBulletAsset=loadImage(ENEMY_BULLET_URL);
const rocketSmokeAsset=loadImage(ROCKET_SMOKE_URL);
const energyCrystalAsset=loadImage(ENERGY_CRYSTAL_URL);
const healthCrossAsset=loadImage(HEALTH_CROSS_URL);
const ROCKET_DISPLAY_H=34;
const HERO_BULLET_DISPLAY_H=17;
const ENEMY_BULLET_DISPLAY_H=15;
const ROCKET_SMOKE_DISPLAY_H=58;
const ENERGY_CRYSTAL_DISPLAY_H=24;
const HEALTH_CROSS_DISPLAY_H=24;

const MOVE_FRAMES={
 run:[[6,42,206,306],[194,42,209,307],[402,43,196,304],[583,38,239,309],[808,42,208,306],[1008,39,208,310],[1220,43,211,306],[1436,42,217,307]],
 jump:[[411,436,215,244],[679,358,262,281],[984,421,287,269]],
 fall:[[463,687,326,229],[885,692,334,246]]
};



// Corrected guard sheets are 1122x1402 transparent PNGs.
// Rectangles deliberately keep a little transparent padding so animation frames
// stay a consistent size and no neighboring sprite leaks into the crop.
const ENEMY_BASE_W=1122,ENEMY_BASE_H=1402;
const NEW_GUARD_FRAMES={
 idle:[[0,0,280,280],[280,0,281,280],[561,0,281,280]],
 run:[[0,280,280,281],[280,280,281,281],[561,280,281,281]],
 aim:[[0,561,280,280],[280,561,281,280],[561,561,281,280]],
 hit:[[0,841,280,281],[280,841,281,281]]
};







function drawSprite(ctx,img,frame,x,y,facing,displayH,alpha=1){
 const [sx,sy,sw,sh]=frame;
 const dw=displayH*(sw/sh);
 ctx.save();
 ctx.globalAlpha*=alpha;
 ctx.translate(x,y);
 ctx.scale(facing,1);
 ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-displayH,dw,displayH);
 ctx.restore();
}

function scaledFrames(frames,img,baseW,baseH){
 const sx=img.naturalWidth/baseW,sy=img.naturalHeight/baseH;
 return frames.map(([x,y,w,h])=>[x*sx,y*sy,w*sx,h*sy]);
}



const bossDeathStart=new WeakMap();

export function createArt(ctx){
 const base=createBaseArt(ctx);
 const baseHero=base.hero;

 function hero(p,time){
  const movement=movementAsset.img;
  const special=p.invulnerable>1.05||p.dashTime>0||p.shot>.02;
  if(special){baseHero(p,time);return;}
  ctx.save();
  ctx.globalAlpha=.24;
  ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h+2,22,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(!p.grounded){
   if(p.vy<60){
    const frame=p.vy<-260?MOVE_FRAMES.jump[1]:MOVE_FRAMES.jump[2];
    drawSprite(ctx,movement,frame,p.x+p.w/2,p.y+p.h,p.facing,79);
   }else{
    const i=Math.floor(time*7)%MOVE_FRAMES.fall.length;
    drawSprite(ctx,movement,MOVE_FRAMES.fall[i],p.x+p.w/2,p.y+p.h,p.facing,76);
   }
   return;
  }
  if(Math.abs(p.vx)>28){
   const speed=Math.min(15,9+Math.abs(p.vx)/55);
   const i=Math.floor(time*speed)%MOVE_FRAMES.run.length;
   drawSprite(ctx,movement,MOVE_FRAMES.run[i],p.x+p.w/2,p.y+p.h,p.facing,82);
   return;
  }
  baseHero(p,time);
 }

 function drawDrone(e,time){
  const attacking=e.windup>0||e.shotFlash>0;
  const asset=attacking?droneAttackAsset:droneIdleAsset;
  const centerX=e.x+e.w/2;
  const centerY=e.y+e.h/2+Math.sin(time*3.4+(e.hoverPhase??0))*3.2;
  const facing=e.windup>0&&e.aimX?e.aimX<centerX?-1:1:e.vx<0?-1:1;
  const size=86;
  ctx.save();
  ctx.globalAlpha=.22;ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(centerX,e.y+e.h+13,31,5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(asset.ready){
   ctx.save();
   ctx.translate(centerX,centerY);
   ctx.scale(facing,1);
   ctx.rotate(Math.sin(time*2.6+(e.hoverPhase??0))*.025);
   ctx.drawImage(asset.img,-size/2,-size/2,size,size);
   ctx.restore();
  }else{
   ctx.save();ctx.translate(centerX,centerY);
   ctx.fillStyle='#26343e';ctx.strokeStyle='#8ad8ff';ctx.lineWidth=2;
   ctx.fillRect(-24,-9,48,18);ctx.strokeRect(-24,-9,48,18);
   ctx.restore();
  }
 }

 function enemy(e,time){
  const type=enemyKind(e);
  if(type==='drone'){drawDrone(e,time);return;}
  const asset=type==='city'?cityAsset:type==='newguard'?newGuardAsset:type==='sniper'?sniperAsset:heavyAsset;
  const frames=type==='newguard'?NEW_GUARD_FRAMES:type==='city'?CITY_FRAMES:type==='sniper'?SNIPER_FRAMES:HEAVY_FRAMES;
  const img=asset.img;
  const attack=enemyAttackPose(e);
  if(attack){
   // Guard aim/fire atlas rows are cropped around the upper body. Keep a
   // complete full-body guard sprite for the entire attack sequence and let
   // the projectile/muzzle effect communicate the shot.
   const full=scaledFrames(frames.idle,img,ENEMY_BASE_W,ENEMY_BASE_H);
   const fullFrame=full[Math.floor(time*4+e.x*.006)%full.length];
   drawSprite(ctx,img,fullFrame,e.x+e.w/2,e.y+e.h,attack.facing,enemyDisplayHeight(e));
   return;
  }
  let state='idle',rate=4,displayH=enemyDisplayHeight(e);
  if(e.hit>0){state='hit';rate=12;}
  else if(Math.abs(e.vx)>5){state='run';rate=4.5;}

  const set=frames[state]||frames.idle;
  const scaled=scaledFrames(set,img,ENEMY_BASE_W,ENEMY_BASE_H);
  const i=Math.floor(time*rate+e.x*.006)%scaled.length;
  const center=e.x+e.w/2;
  const facing=enemyFacing(e);

  ctx.save();
  ctx.globalAlpha=.24;
  ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(center,e.y+e.h+2,type==='heavy'?27:21,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  drawSprite(ctx,img,scaled[i],center,e.y+e.h,facing,displayH);
  if(type==='newguard'&&e.shieldFlash>0){
   const pulse=Math.min(1,e.shieldFlash/.18);
   ctx.save();
   ctx.globalAlpha=.55*pulse;
   ctx.strokeStyle='#a9dcff';ctx.lineWidth=3;
   ctx.shadowColor='#7fc8ff';ctx.shadowBlur=12;
   const shieldX=center+facing*24;
   ctx.beginPath();
   ctx.arc(shieldX,e.y+e.h-displayH*.53,18,Math.PI*.58,Math.PI*1.42);
   ctx.stroke();
   ctx.restore();
  }
 }

 function boss(b,time){
  const gatekeeper=bossAsset.img;
  let frames=BOSS_FRAMES.idle,rate=3.4,displayH=146;
  if(b.hp<=0){
   if(!bossDeathStart.has(b))bossDeathStart.set(b,time);
   const elapsed=time-bossDeathStart.get(b);
   const duration=1.35;
   if(elapsed>=duration)return;
   const i=Math.min(BOSS_FRAMES.death.length-1,Math.floor(elapsed/duration*BOSS_FRAMES.death.length));
   drawSprite(ctx,gatekeeper,BOSS_FRAMES.death[i],b.x+b.w/2,b.y+b.h,-1,136);
   return;
  }
  bossDeathStart.delete(b);
  const attack=enemyAttackPose(b,true);
  if(attack){const frame=scaledFrames([attack.frame],gatekeeper,1254,1254)[0];drawSprite(ctx,gatekeeper,frame,b.x+b.w/2,b.y+b.h,attack.facing,attack.height);return;}
  const facing=(b.aimX||0)<b.x?-1:1;
  if(b.hit>0){frames=BOSS_FRAMES.hit;rate=12;displayH=145;}

  else if(b.hp<12){frames=BOSS_FRAMES.enraged;rate=9;displayH=150;}
  const i=Math.floor(time*rate)%frames.length;
  ctx.save();ctx.globalAlpha=.30;ctx.fillStyle='#081220';ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h+3,52,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawSprite(ctx,gatekeeper,frames[i],b.x+b.w/2,b.y+b.h,facing,displayH);
 }

 function enemyMuzzle(e,time,isBoss=false){
  if(!isBoss)return fallbackEnemyMuzzle(e,time,false);
  const asset=bossAsset,pose=enemyAttackPose(e,true);
  return asset.ready&&pose?pose.muzzle:fallbackEnemyMuzzle(e,time,true);
 }
 function rocket(x,y,angle){
  if(!rocketAsset.ready)return false;
  const img=rocketAsset.img,dh=ROCKET_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
  return true;
 }
 function heroBullet(x,y,angle){
  if(!heroBulletAsset.ready)return false;
  const img=heroBulletAsset.img,dh=HERO_BULLET_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
  return true;
 }
 function enemyBullet(x,y,angle){
  if(!enemyBulletAsset.ready)return false;
  const img=enemyBulletAsset.img,dh=ENEMY_BULLET_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
  return true;
 }
 // Drawn with its bright tip anchored at (x,y) — the rocket's tail — and
 // trailing backward along -angle, so it billows away behind the rocket.
 function rocketSmoke(x,y,angle){
  if(!rocketSmokeAsset.ready)return false;
  const img=rocketSmokeAsset.img,dh=ROCKET_SMOKE_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-dw,-dh/2,dw,dh);ctx.restore();
  return true;
 }
 // Gently bobbing/spinning energy-crystal pickup, replacing the plain gold star.
 function collectible(x,y,time,id){
  if(!energyCrystalAsset.ready)return false;
  const img=energyCrystalAsset.img,dh=ENERGY_CRYSTAL_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.save();ctx.translate(x,y+Math.sin(time*3+id)*3);ctx.rotate(Math.sin(time*2+id)*.12);
  ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
  return true;
 }
 // Softly pulsing medic-cross pickup, replacing the plain drawn heart glyph.
 function healthItem(x,y,time,id){
  if(!healthCrossAsset.ready)return false;
  const img=healthCrossAsset.img,scale=1+Math.sin(time*4+id)*.08,dh=HEALTH_CROSS_DISPLAY_H*scale,dw=dh*(img.naturalWidth/img.naturalHeight);
  ctx.drawImage(img,x-dw/2,y-dh/2,dw,dh);
  return true;
 }
 return {...base,hero,enemy,boss,enemyMuzzle,rocket,heroBullet,enemyBullet,rocketSmoke,collectible,healthItem};
}

