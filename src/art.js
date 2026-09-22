import {BOSS_FRAMES,CITY_FRAMES,HEAVY_FRAMES,SNIPER_FRAMES,enemyKind,enemyFacing,enemyAttackPose,fallbackEnemyMuzzle} from './enemy-weapon.js?v=20260922-hq-sprites-1';
import {enemyDisplayHeight} from './hero-weapon.js?v=20260921-stage2-new-enemies-1';
import {createArt as createBaseArt} from './art-base.js?v=20260921-cleanup-1';

const BOSS_URL='./assets/Gatekeeper.png';
const CITY_URL='./assets/City_Guard.png';
const HEAVY_URL='./assets/Heavy_Guard.png';
const SNIPER_URL='./assets/Sniper_Rooftop_Guard.png';
const MOVEMENT_URL='./assets/aboden-hero-movement.png';

const MOVE_FRAMES=Object.freeze({
 run:[[6,42,206,306],[194,42,209,307],[402,43,196,304],[583,38,239,309],[808,42,208,306],[1008,39,208,310],[1220,43,211,306],[1436,42,217,307]],
 jump:[[411,436,215,244],[679,358,262,281],[984,421,287,269]],
 fall:[[463,687,326,229],[885,692,334,246]]
});

const HERO_POSE_SETS=Object.freeze({
 idle:[
  ['./assets/stage2/rooftop/A683D766-579C-4F78-9DF1-425E03CAACED.png',[111,51,1134,1212]],
  ['./assets/stage2/rooftop/50B3B697-BC29-4C39-8278-49C7AE643BC7.png',[96,47,1210,1182]],
  ['./assets/stage2/rooftop/E1490764-AF8C-4DE7-8182-3895BB2E1BDE.png',[97,57,1210,1254]],
  ['./assets/stage2/rooftop/EDFA0F7E-8277-4744-A1D8-83A77E114397.png',[258,84,1057,1238]]
 ],
 shoot:[
  ['./assets/stage2/rooftop/07D8F9F6-4DE1-48F5-A2AB-58E5A204DE56.png',[63,21,1214,1234]],
  ['./assets/stage2/rooftop/ABC893E7-6718-4006-8568-4B74BABAFDC1.png',[69,21,1224,1235]],
  ['./assets/stage2/rooftop/CB6B8417-8564-4F27-BFEB-8DB12889CF23.png',[89,53,1224,1222]]
 ],
 hurt:[['./assets/stage2/rooftop/81AF200A-886A-4CA2-A2DF-8F7E0FD7A6CF.png',[73,48,1214,1254]]],
 climb:[['./assets/stage2/rooftop/77A34199-B559-4A99-8683-92889A35586F.png',[0,26,1059,1220]]],
 meleeIdle:[['./assets/stage2/rooftop/28C8741E-FF4D-4642-9B2D-F77236FFA97F.png',[91,41,1218,1254]]],
 punch1:[['./assets/stage2/rooftop/3E73BF27-069C-4E22-A80D-737550CFA7B9.png',[0,31,1253,1254]]],
 punch2:[['./assets/stage2/rooftop/A95ABCE5-11A8-4AA5-8FCE-5F18B016F5E6.png',[0,21,1236,1254]]],
 heavy:[['./assets/stage2/rooftop/159DD9FD-ADB2-448C-98FD-CD14991E4FE2.png',[0,9,1208,1244]]],
 block:[['./assets/stage2/rooftop/A7CFFEBC-EE18-4086-9F82-9B2840FB5B08.png',[39,21,1234,1238]]],
 dodge:[['./assets/stage2/rooftop/452DCE10-755B-4E2E-8D53-7B6C3E5790B8.png',[0,21,1247,1229]]]
});

const NEW_GUARD_URLS=Object.freeze({
 idle:'./assets/stage2/rooftop/979836E9-6441-4AD5-9AAB-301DEDDA3F08.png',
 walk:'./assets/stage2/rooftop/7FDACB48-1789-4A22-9EBC-8BE321E13B4D.png',
 aim:'./assets/stage2/rooftop/467F9C1F-30BE-4274-953A-E6CF9ADC358B.png',
 fire:'./assets/stage2/rooftop/06266B22-0894-489A-9711-B79239B1A128.png',
 block:'./assets/stage2/rooftop/33329A1A-C050-441E-9D23-C85EEDBCFD88.png',
 hurt:'./assets/stage2/rooftop/9F2B5146-8350-45D9-86C0-A7E3A03FD43F.png',
 defeat:'./assets/stage2/rooftop/799F6394-1C8A-431B-9BCD-12EE63BAFE65.png'
});
const NEW_GUARD_ANIMS=Object.freeze({
 idle:{refH:680,boxes:[[0,3,537,690],[546,7,1072,692],[1095,23,1629,706],[1629,15,2120,708]]},
 walk:{refH:680,boxes:[[0,55,724,685],[724,140,1448,724],[1448,41,2132,702]]},
 aim:{refH:680,boxes:[[57,101,676,685],[725,101,1408,706],[1497,47,2120,708]]},
 fire:{refH:680,boxes:[[25,2,543,690],[543,31,1086,692],[1086,23,1628,697],[1629,27,2172,678]]},
 block:{refH:820,boxes:[[19,147,887,869],[887,35,1659,855]]},
 hurt:{refH:680,boxes:[[23,21,706,708],[725,55,1400,708],[1463,98,2126,724]]},
 defeat:{refH:596,boxes:[[10,38,272,634],[272,116,543,634],[543,55,814,636],[814,118,1086,668],[1086,223,1358,672],[1358,246,1629,674],[1629,264,1900,680],[1900,287,2171,691]]}
});

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

const bossAsset=loadImage(BOSS_URL);
const cityAsset=loadImage(CITY_URL);
const heavyAsset=loadImage(HEAVY_URL);
const sniperAsset=loadImage(SNIPER_URL);
const movementAsset=loadImage(MOVEMENT_URL);
const heroPoseAssets=Object.fromEntries(
 Object.entries(HERO_POSE_SETS).map(([k,entries])=>[
  k,
  entries.map(([url,bounds])=>({asset:loadImage(url),bounds}))
 ])
);
const newGuardAssets=Object.fromEntries(Object.entries(NEW_GUARD_URLS).map(([k,url])=>[k,loadImage(url)]));
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
function drawBoundedImage(ctx,asset,box,x,feetY,facing,displayH,alpha=1){
 if(!asset?.ready)return false;
 const [l,t,r,b]=box,sw=r-l,sh=b-t,dw=displayH*(sw/sh);
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,feetY);ctx.scale(facing,1);
 ctx.drawImage(asset.img,l,t,sw,sh,-dw/2,-displayH,dw,displayH);
 ctx.restore();return true;
}
function drawFrameSet(ctx,asset,anim,index,x,feetY,facing,displayH,alpha=1){
 if(!asset?.ready)return false;
 const box=anim.boxes[Math.max(0,Math.min(anim.boxes.length-1,index))];
 const [l,t,r,b]=box,sw=r-l,sh=b-t,scale=displayH/anim.refH;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,feetY);ctx.scale(facing,1);
 ctx.drawImage(asset.img,l,t,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);
 ctx.restore();return true;
}
function phaseIndex(elapsed,duration,count){
 return Math.min(count-1,Math.max(0,Math.floor((elapsed/Math.max(.001,duration))*count)));
}

const bossDeathStart=new WeakMap();

export function createArt(ctx){
 const base=createBaseArt(ctx);
 const baseHero=base.hero;

 function heroMuzzle(p){
  return {x:p.x+p.w/2+p.facing*39,y:p.y+p.h-59};
 }
 function hero(p,time){
  ctx.save();
  ctx.globalAlpha=.24;ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h+2,22,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // The uploaded Run/Jump/Fall/Dash files are single key poses, not animation
  // sheets. Using them while the physics body moves causes visible skating.
  // Keep the HQ uploaded art for matching action poses, but use the repository's
  // real multi-frame movement sheet for locomotion.
  if(p.dashTime>0){baseHero(p,time);return;}
  if(p.shot<=.02&&p.invulnerable<=1.05&&!p.grounded&&movementAsset.ready){
    const frames=p.vy<60?MOVE_FRAMES.jump:MOVE_FRAMES.fall;
    const i=p.vy<60?Math.min(frames.length-1,p.vy<-260?1:2):Math.floor(time*7)%frames.length;
    drawSprite(ctx,movementAsset.img,frames[i],p.x+p.w/2,p.y+p.h,p.facing,p.vy<60?79:76);
    return;
  }
  if(p.shot<=.02&&p.invulnerable<=1.05&&p.grounded&&Math.abs(p.vx)>28&&movementAsset.ready){
    const speed=Math.min(15,9+Math.abs(p.vx)/55);
    const i=Math.floor(time*speed)%MOVE_FRAMES.run.length;
    drawSprite(ctx,movementAsset.img,MOVE_FRAMES.run[i],p.x+p.w/2,p.y+p.h,p.facing,82);
    return;
  }

  let state='idle',displayH=82;
  if(p.invulnerable>1.05){state='hurt';displayH=80;}
  else if(p.shot>.02){state='shoot';displayH=83;}

  const set=heroPoseAssets[state]??heroPoseAssets.idle;
  const index=state==='shoot'
    ?Math.min(set.length-1,Math.floor(Math.max(0,.14-p.shot)/.14*set.length))
    :Math.floor(time*2.2)%set.length;
  const pose=set[index]??set[0];
  if(drawBoundedImage(ctx,pose.asset,pose.bounds,p.x+p.w/2,p.y+p.h,p.facing,displayH))return;
  base.hero(p,time);
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

 function drawNewGuard(e,time){
  const center=e.x+e.w/2,feet=e.y+e.h,facing=enemyFacing(e),displayH=enemyDisplayHeight(e);
  let state='idle',index=0;
  if(e.hp<=0){
   state='defeat';
   index=phaseIndex(time-(e.deathAt??time),.90,NEW_GUARD_ANIMS.defeat.boxes.length);
  }else if(e.shieldFlash>0){
   state='block';
   index=phaseIndex(.18-e.shieldFlash,.18,NEW_GUARD_ANIMS.block.boxes.length);
  }else if(e.hit>0){
   state='hurt';
   index=phaseIndex(.12-e.hit,.12,NEW_GUARD_ANIMS.hurt.boxes.length);
  }else if(e.shotFlash>0){
   state='fire';
   index=phaseIndex(.20-e.shotFlash,.20,NEW_GUARD_ANIMS.fire.boxes.length);
  }else if(e.windup>0){
   state='aim';
   const duration=e.windupDuration??.44;
   index=phaseIndex(duration-e.windup,duration,NEW_GUARD_ANIMS.aim.boxes.length);
  }else if(Math.abs(e.vx)>5){
   state='walk';
   index=Math.floor(time*5.2+e.x*.006)%NEW_GUARD_ANIMS.walk.boxes.length;
  }else{
   index=Math.floor(time*3.2+e.x*.006)%NEW_GUARD_ANIMS.idle.boxes.length;
  }

  ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(center,feet+2,23,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawFrameSet(ctx,newGuardAssets[state],NEW_GUARD_ANIMS[state],index,center,feet,facing,displayH);
 }

 function enemy(e,time){
  const type=enemyKind(e);
  if(type==='drone'){drawDrone(e,time);return;}
  if(type==='newguard'){drawNewGuard(e,time);return;}
  const asset=type==='city'?cityAsset:type==='sniper'?sniperAsset:heavyAsset;
  const frames=type==='city'?CITY_FRAMES:type==='sniper'?SNIPER_FRAMES:HEAVY_FRAMES;
  const img=asset.img;
  const attack=enemyAttackPose(e);
  if(attack){
   const full=scaledFrames(frames.idle,img,1122,1402);
   const fullFrame=full[Math.floor(time*4+e.x*.006)%full.length];
   drawSprite(ctx,img,fullFrame,e.x+e.w/2,e.y+e.h,attack.facing,enemyDisplayHeight(e));
   return;
  }
  let state='idle',rate=4,displayH=enemyDisplayHeight(e);
  if(e.hit>0){state='hit';rate=12;}
  else if(Math.abs(e.vx)>5){state='run';rate=4.5;}
  const set=frames[state]||frames.idle;
  const scaled=scaledFrames(set,img,1122,1402);
  const i=Math.floor(time*rate+e.x*.006)%scaled.length;
  const center=e.x+e.w/2,facing=enemyFacing(e);
  ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(center,e.y+e.h+2,type==='heavy'?27:21,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawSprite(ctx,img,scaled[i],center,e.y+e.h,facing,displayH);
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
 return {...base,hero,heroMuzzle,enemy,boss,enemyMuzzle,rocket,heroBullet,enemyBullet,rocketSmoke,collectible,healthItem};
}

