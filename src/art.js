import {createArt as createBaseArt} from './art-base.js?v=20260917-sprites-2';

const MOVEMENT_URL='./assets/aboden-hero-movement.png';
const BOSS_URL='./assets/Gatekeeper.png';
const CITY_URL='./assets/City_Guard.png';
const HEAVY_URL='./assets/Heavy_Guard.png';
const SNIPER_URL='./assets/Sniper_Rooftop_Guard.png';

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

const MOVE_FRAMES={
 run:[[6,42,206,306],[194,42,209,307],[402,43,196,304],[583,38,239,309],[808,42,208,306],[1008,39,208,310],[1220,43,211,306],[1436,42,217,307]],
 jump:[[411,436,215,244],[679,358,262,281],[984,421,287,269]],
 fall:[[463,687,326,229],[885,692,334,246]]
};

const BOSS_FRAMES={
 idle:[[146,13,191,187],[347,10,189,190],[546,10,189,190],[747,14,189,186]],
 aim:[[147,214,209,175],[374,214,209,175],[616,215,240,174]],
 charge:[[147,404,225,173],[401,403,242,174],[663,400,231,177]],
 fire:[[143,589,261,164],[401,588,271,165],[655,587,248,166],[896,587,237,165]],
 hit:[[147,768,196,165],[374,767,190,166]],
 enraged:[[153,942,218,159],[394,944,217,157],[634,930,236,172]],
 death:[[127,1110,125,129],[255,1113,125,126],[382,1124,117,115],[498,1134,129,105],[622,1139,152,100],[770,1150,142,89],[915,1144,167,95],[1084,1143,157,94]]
};

const CITY_FRAMES={
 idle:[[100,66,145,250],[245,66,145,250],[390,66,145,250],[535,66,145,250]],
 run:[[105,348,175,218],[280,348,180,218],[470,348,185,218]],
 aim:[[850,66,170,250],[1020,66,180,250],[1200,66,175,250]],
 charge:[[105,348,175,218],[280,348,180,218],[470,348,185,218]],
 fire:[[790,348,200,220],[985,348,200,220],[1175,348,195,220],[1350,348,186,220]],
 hit:[[95,590,215,220],[315,590,205,220]],
 enraged:[[840,590,215,220],[1050,590,215,220],[1260,590,210,220]],
 death:[[95,825,175,178],[265,825,180,178],[445,825,185,178],[625,825,185,178],[810,825,190,178],[995,825,190,178],[1180,825,185,178],[1360,825,176,178]]
};

const SNIPER_FRAMES={
 idle:[[100,69,130,122],[230,69,130,122],[360,69,130,122],[490,69,145,122]],
 run:[[100,198,150,122],[250,198,165,122],[415,198,150,122],[565,198,165,122],[730,198,150,122],[880,198,165,122],[1045,198,165,122],[1210,198,195,122]],
 aim:[[100,455,175,122],[275,455,180,122],[455,455,190,122]],
 charge:[[875,455,185,122],[1060,455,180,122],[1240,455,175,122]],
 fire:[[100,585,220,135],[320,585,225,135],[545,585,250,135],[545,585,250,135]],
 hit:[[915,585,200,135],[1115,585,195,135]],
 enraged:[[125,730,200,128],[325,730,200,128],[525,730,200,128]],
 death:[[100,862,170,130],[270,862,165,130],[435,862,170,130],[605,862,160,130],[765,862,170,130],[935,862,170,130],[1105,862,165,130],[1270,862,245,130]]
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
 const baseEnemy=base.enemy;
 const baseBoss=base.boss;

 function hero(p,time){
  const movement=movementAsset.img;
  const special=p.invulnerable>1.05||p.dashTime>0||p.shot>.02;
  if(!movementAsset.ready||special){baseHero(p,time);return;}
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
  const slot=Math.floor(((e.min??e.x)+250)/900)%3;
  const type=slot===0?'city':slot===1?'sniper':'heavy';
  const asset=type==='city'?cityAsset:type==='sniper'?sniperAsset:heavyAsset;
  if(!asset.ready){baseEnemy(e,time);return;}
  const img=asset.img;
  let frames;
  if(type==='sniper')frames=SNIPER_FRAMES;
  else if(type==='heavy'&&img.naturalWidth/img.naturalHeight<1.2)frames=BOSS_FRAMES;
  else frames=CITY_FRAMES;

  const baseW=frames===SNIPER_FRAMES||frames===CITY_FRAMES?1536:1254;
  const baseH=frames===SNIPER_FRAMES||frames===CITY_FRAMES?1024:1254;
  let state='idle',rate=4,displayH=type==='heavy'?82:72;
  if(e.hit>0){state='hit';rate=12;}
  else if(e.windup>0){state=e.windup>.20?'aim':'charge';rate=10;}
  else if(e.fire>1.52){state='fire';rate=18;}
  else if(Math.abs(e.vx)>5){state='run';rate=type==='sniper'?11:8;}
  const set=frames[state]||frames.idle;
  const scaled=scaledFrames(set,img,baseW,baseH);
  const i=Math.floor(time*rate+e.x*.01)%scaled.length;
  const facing=(e.windup>0?e.aimX<e.x:e.vx<0)?-1:1;
  ctx.save();ctx.globalAlpha=.24;ctx.fillStyle='#071220';ctx.beginPath();ctx.ellipse(e.x+e.w/2,e.y+e.h+2,type==='heavy'?25:20,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawSprite(ctx,img,scaled[i],e.x+e.w/2,e.y+e.h,facing,displayH);
 }

 function boss(b,time){
  const gatekeeper=bossAsset.img;
  if(!bossAsset.ready){baseBoss(b,time);return;}
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
  const facing=(b.aimX||0)<b.x?-1:1;
  const maxFire=b.hp<12?1.05:1.45;
  if(b.hit>0){frames=BOSS_FRAMES.hit;rate=12;displayH=145;}
  else if(b.active&&b.windup>0){
   if(b.windup>.31){frames=BOSS_FRAMES.aim;rate=8;displayH=147;}
   else{frames=BOSS_FRAMES.charge;rate=12;displayH=148;}
  }else if(b.active&&b.fire>maxFire-.20){frames=BOSS_FRAMES.fire;rate=18;displayH=146;}
  else if(b.hp<12){frames=BOSS_FRAMES.enraged;rate=9;displayH=150;}
  const i=Math.floor(time*rate)%frames.length;
  ctx.save();ctx.globalAlpha=.30;ctx.fillStyle='#081220';ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h+3,52,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
  drawSprite(ctx,gatekeeper,frames[i],b.x+b.w/2,b.y+b.h,facing,displayH);
 }

 return {...base,hero,enemy,boss};
}
