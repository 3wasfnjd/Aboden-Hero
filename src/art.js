import {createArt as createBaseArt} from './art-base.js?v=20260917-sprites-1';

const MOVEMENT_URL='./assets/aboden-hero-movement.png';
const BOSS_URL='./assets/Gatekeeper.png';

const movement=new Image();
movement.decoding='async';
movement.src=MOVEMENT_URL;
let movementReady=false;
movement.addEventListener('load',()=>{movementReady=true;});

const gatekeeper=new Image();
gatekeeper.decoding='async';
gatekeeper.src=BOSS_URL;
let bossReady=false;
gatekeeper.addEventListener('load',()=>{bossReady=true;});

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

const bossDeathStart=new WeakMap();

export function createArt(ctx){
 const base=createBaseArt(ctx);
 const baseHero=base.hero;
 const baseBoss=base.boss;

 function hero(p,time){
  const special=p.invulnerable>1.05||p.dashTime>0||p.shot>.02;
  if(!movementReady||special){baseHero(p,time);return;}
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

 function boss(b,time){
  if(!bossReady){baseBoss(b,time);return;}
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

 return {...base,hero,boss};
}
