import {createArt as createBaseArt} from './art-base.js?v=20260917-guards-3';

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

// Corrected guard sheets are 1122x1402 transparent PNGs.
// Rectangles deliberately keep a little transparent padding so animation frames
// stay a consistent size and no neighboring sprite leaks into the crop.
const ENEMY_BASE_W=1122,ENEMY_BASE_H=1402;

const CITY_FRAMES={
 idle:[[42,25,145,250],[226,25,151,250],[408,25,146,250],[584,25,138,250]],
 run:[[42,25,145,250],[226,25,151,250],[408,25,146,250],[584,25,138,250]],
 aim:[[34,292,165,210],[215,292,186,210],[404,292,205,210]],
 charge:[[45,500,190,230],[278,500,215,230],[520,500,245,230]],
 fire:[[40,742,171,175],[240,742,218,175],[464,742,216,175],[675,742,180,175]],
 hit:[[45,940,162,165],[235,940,148,165]],
 enraged:[[115,1095,205,150],[318,1095,158,150],[500,1095,180,150]]
};

const HEAVY_FRAMES={
 idle:[[30,20,178,270],[216,20,176,270],[399,20,171,270],[583,20,178,270]],
 run:[[30,20,178,270],[216,20,176,270],[399,20,171,270],[583,20,178,270]],
 aim:[[16,292,226,212],[226,292,222,212],[421,292,248,212]],
 charge:[[25,495,210,220],[244,495,230,220],[469,495,292,220]],
 fire:[[18,720,214,220],[238,720,332,220],[565,720,230,220],[825,720,279,220]],
 hit:[[18,945,224,250],[230,945,180,250]],
 enraged:[[438,945,224,250],[638,945,218,250],[830,945,276,250]]
};

const SNIPER_FRAMES={
 idle:[[255,15,165,240],[416,15,165,240],[574,15,165,240],[734,15,176,240]],
 run:[[255,15,165,240],[416,15,165,240],[574,15,165,240],[734,15,176,240]],
 aim:[[220,258,236,225],[438,258,256,225],[671,258,277,225]],
 charge:[[188,468,244,222],[434,468,240,222],[666,468,260,222]],
 fire:[[48,690,265,210],[282,690,318,210],[582,690,267,210],[830,690,275,210]],
 hit:[[70,900,205,230],[70,900,205,230]],
 enraged:[[310,900,265,230],[560,900,326,230]]
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

function enemyKind(e){
 if(e.kind)return e.kind;
 const slot=Math.floor(((e.min??e.x)+250)/900)%3;
 return slot===0?'city':slot===1?'sniper':'heavy';
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
  const type=enemyKind(e);
  const asset=type==='city'?cityAsset:type==='sniper'?sniperAsset:heavyAsset;
  const frames=type==='city'?CITY_FRAMES:type==='sniper'?SNIPER_FRAMES:HEAVY_FRAMES;
  if(!asset.ready){baseEnemy(e,time);return;}

  const img=asset.img;
  let state='idle',rate=4,displayH=type==='heavy'?88:type==='sniper'?80:76;
  if(e.hit>0){state='hit';rate=12;}
  else if(e.windup>0){state=e.windup>.20?'aim':'charge';rate=10;}
  else if(e.fire>1.52){state='fire';rate=18;}
  else if(Math.abs(e.vx)>5){state='run';rate=4.5;}

  const set=frames[state]||frames.idle;
  const scaled=scaledFrames(set,img,ENEMY_BASE_W,ENEMY_BASE_H);
  const i=Math.floor(time*rate+e.x*.006)%scaled.length;
  const center=e.x+e.w/2;
  const facing=e.windup>0&&e.aimX?e.aimX<center?-1:1:e.vx<0?-1:1;

  ctx.save();
  ctx.globalAlpha=.24;
  ctx.fillStyle='#071220';
  ctx.beginPath();ctx.ellipse(center,e.y+e.h+2,type==='heavy'?27:21,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  drawSprite(ctx,img,scaled[i],center,e.y+e.h,facing,displayH);
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
