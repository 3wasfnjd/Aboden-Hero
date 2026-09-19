import {BOSS_FRAMES,CITY_FRAMES,HEAVY_FRAMES,SNIPER_FRAMES,enemyKind,enemyAttackPose,fallbackEnemyMuzzle} from './enemy-weapon.js?v=20260917-guards-1';
import {enemyDisplayHeight} from './hero-weapon.js?v=20260917-muzzle-1';
import {createArt as createBaseArt} from './art-base.js?v=20260917-cleanup-2';

const MOVEMENT_URL='./assets/aboden-hero-movement.png';
const BOSS_URL='./assets/Gatekeeper.png';
const CITY_URL='./assets/City_Guard.png';
const HEAVY_URL='./assets/Heavy_Guard.png';
const SNIPER_URL='./assets/Sniper_Rooftop_Guard.png';
const ROCKET_URL='./assets/ui/rocket.png';
const HERO_BULLET_URL='./assets/ui/projectiles/bullet-hero.png';
const ENEMY_BULLET_URL='./assets/ui/projectiles/bullet-red2.png';
const ROCKET_SMOKE_URL='./assets/ui/projectiles/rocket-smoke.png';
const ENERGY_CRYSTAL_URL='./assets/ui/items/energy-crystal.png';
const HEALTH_CROSS_URL='./assets/ui/items/health-cross.png';
const SHIELD_GUARD_URL='./assets/enemies/shield-guard.png';
const SKY_WATCHER_URL='./assets/enemies/sky-watcher.png';
const COMMANDER_URL='./assets/bosses/commander.png';

function loadImage(url){
 const img=new Image();
 img.decoding='async';
 const state={img,ready:false,failed:false};
 img.addEventListener('load',()=>{state.ready=true;});
 img.addEventListener('error',()=>{state.failed=true;});
 img.src=url;
 return state;
}

const movementAsset=loadImage(MOVEMENT_URL);
const bossAsset=loadImage(BOSS_URL);
const cityAsset=loadImage(CITY_URL);
const heavyAsset=loadImage(HEAVY_URL);
const sniperAsset=loadImage(SNIPER_URL);
const rocketAsset=loadImage(ROCKET_URL);
const heroBulletAsset=loadImage(HERO_BULLET_URL);
const enemyBulletAsset=loadImage(ENEMY_BULLET_URL);
const rocketSmokeAsset=loadImage(ROCKET_SMOKE_URL);
const energyCrystalAsset=loadImage(ENERGY_CRYSTAL_URL);
const healthCrossAsset=loadImage(HEALTH_CROSS_URL);
const shieldGuardAsset=loadImage(SHIELD_GUARD_URL);
const skyWatcherAsset=loadImage(SKY_WATCHER_URL);
const commanderAsset=loadImage(COMMANDER_URL);
const SKY_FRAMES={idle:[10,3,330,190],firing:[353,3,344,189],damaged:[734,3,282,190]};
// Full animation sheets (idle/aim/charge/fire/hit/enraged[/death]), cropped
// from the delivered reference sheets at their native resolution.
const SHIELD_FRAMES={
 idle:[[79,4,148,192],[386,3,146,193],[691,4,147,192],[997,4,147,192]],
 aim:[[68,202,169,192],[371,202,175,192],[675,202,180,192]],
 charge:[[63,400,179,197],[354,423,210,174],[643,415,244,182]],
 fire:[[44,603,217,211],[349,604,219,210],[644,603,242,211],[946,618,250,196]],
 hit:[[74,820,157,197],[377,820,163,197]]
};
const COMMANDER_FRAMES={
 idle:[[180,3,201,202],[736,14,210,191],[1292,4,220,201],[1840,5,247,200]],
 aim:[[150,220,261,182],[681,220,320,182],[1232,211,340,191]],
 charge:[[153,408,254,191],[681,418,320,181],[1233,418,338,181]],
 fire:[[188,605,185,182],[721,614,240,173],[1282,614,240,173],[1807,614,313,173]],
 hit:[[174,793,212,179],[564,793,555,179]],
 enraged:[[148,978,265,195],[698,978,286,195],[1243,986,318,187]],
 death:[[238,1196,85,141],[781,1179,120,158],[1342,1225,120,112],[1903,1179,120,158],[2459,1179,130,158],[3020,1268,130,69],[3585,1179,122,158],[4140,1274,134,63]]
};
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

 function enemy(e,time){
  const center=e.x+e.w/2;
  const facing=e.windup>0&&e.aimX?e.aimX<center?-1:1:e.vx<0?-1:1;
  if(e.flying){drawChopper(e,center,facing,time);return;}
  if(e.shield){drawShieldGuard(e,center,facing,time);return;}
  const type=enemyKind(e);
  const asset=type==='city'?cityAsset:type==='sniper'?sniperAsset:heavyAsset;
  const frames=type==='city'?CITY_FRAMES:type==='sniper'?SNIPER_FRAMES:HEAVY_FRAMES;
  const img=asset.img;
  const attack=enemyAttackPose(e);
  if(attack){const frame=scaledFrames([attack.frame],img,ENEMY_BASE_W,ENEMY_BASE_H)[0];drawSprite(ctx,img,frame,e.x+e.w/2,e.y+e.h,attack.facing,attack.height);return;}
  let state='idle',rate=4,displayH=enemyDisplayHeight(e);
  if(e.hit>0){state='hit';rate=12;}
  else if(Math.abs(e.vx)>5){state='run';rate=4.5;}

  const set=frames[state]||frames.idle;
  const scaled=scaledFrames(set,img,ENEMY_BASE_W,ENEMY_BASE_H);
  const i=Math.floor(time*rate+e.x*.006)%scaled.length;

  ctx.save();
  ctx.globalAlpha=.24;
  ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(center,e.y+e.h+2,type==='heavy'?27:21,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  drawSprite(ctx,img,scaled[i],center,e.y+e.h,facing,displayH);
 }

 // Picks a state name from the shared idle/aim/charge/fire/hit[/enraged]
 // vocabulary: charge is the early, dashing half of the windup telegraph,
 // aim is the settled half right before the shot fires.
 function pickAnimState(e,enraged){
  if(e.hit>0)return 'hit';
  if(e.shotFlash>0)return 'fire';
  if(e.windup>0)return e.windup>(e.windupDuration??.48)*.45?'charge':'aim';
  return enraged?'enraged':'idle';
 }
 function animFrame(frames,state,time,rate){
  const set=frames[state]||frames.idle;
  return set[Math.floor(time*rate)%set.length];
 }

 // Elite guard carrying a riot shield: blocks frontal hits (see main.js),
 // with its own idle/aim/charge/fire/hit animation cycle.
 function drawShieldGuard(e,center,facing,time){
  const img=shieldGuardAsset.img;
  const state=pickAnimState(e,false);
  const rate=state==='fire'?16:state==='charge'?11:state==='aim'?8:state==='hit'?10:3;
  const frame=animFrame(SHIELD_FRAMES,state,time,rate);
  ctx.save();
  ctx.globalAlpha=.24;ctx.fillStyle='#071220';ctx.beginPath();ctx.ellipse(center,e.y+e.h+2,27,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.restore();
  drawSprite(ctx,img,frame,center,e.y+e.h,facing,enemyDisplayHeight(e));
 }

 // Hovering gunner mini-boss: idle hover, firing burst, damaged (smoking).
 function drawChopper(e,center,facing,time){
  const img=skyWatcherAsset.img;
  const pose=e.hit>0?'damaged':e.shotFlash>0||e.windup>0?'firing':'idle';
  const [fx,fy,fw,fh]=SKY_FRAMES[pose];
  const displayH=54,dw=displayH*(fw/fh);
  const y=e.y+e.h/2+Math.sin(time*2.4)*4;
  ctx.save();
  ctx.globalAlpha=.22;ctx.fillStyle='#050a12';ctx.beginPath();ctx.ellipse(center,e.y+e.h+70,22,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.translate(center,y);
  ctx.scale(facing,1);
  ctx.drawImage(img,fx,fy,fw,fh,-dw/2,-displayH/2,dw,displayH);
  ctx.restore();
 }

 function boss(b,time){
  if(b.kind==='captain')return drawCaptain(b,time);
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

  else if(b.hp<b.maxHP/2){frames=BOSS_FRAMES.enraged;rate=9;displayH=150;}
  const i=Math.floor(time*rate)%frames.length;
  ctx.save();ctx.globalAlpha=.30;ctx.fillStyle='#081220';ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h+3,52,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawSprite(ctx,gatekeeper,frames[i],b.x+b.w/2,b.y+b.h,facing,displayH);
 }

 // Chapter 2's final boss: the guard commander, with the same idle/aim/
 // charge/fire/hit/enraged/death cycle as the shield guard, at boss scale.
 function drawCaptain(b,time){
  const cx=b.x+b.w/2,base=b.y+b.h,facing=(b.aimX||0)<b.x?-1:1;
  const displayH=150;
  if(b.hp<=0){
   if(!bossDeathStart.has(b))bossDeathStart.set(b,time);
   const elapsed=time-bossDeathStart.get(b);
   const duration=1.35;
   if(elapsed>=duration)return;
   const set=COMMANDER_FRAMES.death;
   const i=Math.min(set.length-1,Math.floor(elapsed/duration*set.length));
   drawSprite(ctx,commanderAsset.img,set[i],cx,base,facing,displayH*.9);
   return;
  }
  bossDeathStart.delete(b);
  const enraged=b.hp<b.maxHP/2;
  const state=pickAnimState(b,enraged);
  const rate=state==='fire'?18:state==='charge'?12:state==='aim'?9:state==='hit'?12:state==='enraged'?9:3.2;
  const frame=animFrame(COMMANDER_FRAMES,state,time,rate);
  ctx.save();
  ctx.globalAlpha=.3;ctx.fillStyle='#081220';ctx.beginPath();ctx.ellipse(cx,base+3,40,7,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(b.hit>0)ctx.filter='brightness(1.7) saturate(1.2)';
  else if(enraged)ctx.filter=`saturate(1.6) brightness(${1.1+Math.sin(time*8)*.08})`;
  drawSprite(ctx,commanderAsset.img,frame,cx,base,facing,displayH);
  ctx.restore();
 }

 function enemyMuzzle(e,time,isBoss=false){const asset=isBoss?bossAsset:enemyKind(e)==='city'?cityAsset:enemyKind(e)==='sniper'?sniperAsset:heavyAsset;const pose=enemyAttackPose(e,isBoss);return asset.ready&&pose?pose.muzzle:fallbackEnemyMuzzle(e,time,isBoss);}
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

