const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

export const ROOFTOP_LADDER_X=204;

const BG_URL='./assets/stage2/rooftop/E254AA9A-004F-4581-B58B-1FF6F0427114.jpeg';
const LADDER_URL='./assets/stage2/rooftop/C73795B9-E427-4AA3-A3DC-B3C990A6B7F4.png';
const FLOSS_A_URL='./assets/stage2/rooftop/0525AB5D-6007-49F8-8DA2-F7BB8E22D605.png';
const FLOSS_B_URL='./assets/stage2/rooftop/A3B1ACCB-271B-42D1-9AC7-94E9E4CF491B.png';
const HERO_WALK_URL='./assets/aboden-hero-movement.png';

const HERO_WALK_FRAMES=Object.freeze([
  [6,42,206,306],[194,42,209,307],[402,43,196,304],[583,38,239,309],
  [808,42,208,306],[1008,39,208,310],[1220,43,211,306],[1436,42,217,307]
]);

const HERO_MELEE_POSES=Object.freeze({
 climb:['./assets/stage2/rooftop/77A34199-B559-4A99-8683-92889A35586F.png',[303,29,1026,1218]],
 idle:['./assets/stage2/rooftop/28C8741E-FF4D-4642-9B2D-F77236FFA97F.png',[226,44,1083,1224]],
 punch1:['./assets/stage2/rooftop/3E73BF27-069C-4E22-A80D-737550CFA7B9.png',[28,84,1241,1206]],
 punch2:['./assets/stage2/rooftop/A95ABCE5-11A8-4AA5-8FCE-5F18B016F5E6.png',[54,98,1232,1185]],
 heavy:['./assets/stage2/rooftop/159DD9FD-ADB2-448C-98FD-CD14991E4FE2.png',[123,12,1191,1241]],
 block:['./assets/stage2/rooftop/A7CFFEBC-EE18-4086-9F82-9B2840FB5B08.png',[165,27,1133,1233]],
 dodge:['./assets/stage2/rooftop/452DCE10-755B-4E2E-8D53-7B6C3E5790B8.png',[15,291,1244,1026]],
 hurt:['./assets/stage2/rooftop/81AF200A-886A-4CA2-A2DF-8F7E0FD7A6CF.png',[185,50,1121,1201]]
});

const BOSS_URLS=Object.freeze({
 defeat:'./assets/stage2/rooftop/04C075DB-907D-4B1D-95AF-0DC90C81107A.png',
 walk:'./assets/stage2/rooftop/091AAB6A-F854-4477-8752-D1B58381AA37.png',
 idle:'./assets/stage2/rooftop/100882C5-14DA-4017-891C-7CDA8F39F084.png',
 hurt:'./assets/stage2/rooftop/142AAECF-81A4-4CD9-85F3-8D59EBB3F55B.png',
 heavy:'./assets/stage2/rooftop/1D5689D4-376E-410B-8596-22D02BC68210.png',
 attack1:'./assets/stage2/rooftop/A2B6AA2C-3A8F-4CBD-9B30-BDF320327968.png',
 block:'./assets/stage2/rooftop/C935CA0B-5C44-45C4-A29B-1BBA10D4BDA1.png',
 attack2:'./assets/stage2/rooftop/EC12F7F5-4E9E-42B5-B806-48372F81AA5C.png'
});
const BOSS_ANIMS=Object.freeze({
 defeat:{refH:397,boxes:[[8,186,362,583],[362,209,724,583],[724,265,1086,583],[1086,337,1448,580],[1448,381,1810,587],[1810,466,2160,583]]},
 walk:{refH:485,boxes:[[22,161,362,637],[362,154,724,640],[724,154,1086,638],[1086,154,1448,640],[1448,154,1810,640],[1810,154,2172,640]]},
 idle:{refH:600,boxes:[[44,83,517,681],[565,83,1086,681],[1086,79,1586,681],[1677,79,2113,681]]},
 hurt:{refH:639,boxes:[[104,43,724,682],[724,142,1421,682],[1523,114,2112,682]]},
 heavy:{refH:531,boxes:[[16,320,434,631],[434,100,869,631],[869,220,1303,631],[1303,215,1738,645],[1738,267,2156,634]]},
 attack1:{refH:488,boxes:[[50,146,543,638],[543,151,1072,635],[1103,152,1629,637],[1629,150,2149,640]]},
 block:{refH:608,boxes:[[50,80,670,690],[786,86,1399,692],[1496,83,2125,692]]},
 attack2:{refH:466,boxes:[[15,153,543,620],[543,162,1086,621],[1086,167,1629,621],[1629,159,2159,625]]}
});

const LADDER_BASE={w:1024,h:1536};
const LADDER_FRAME=[276,0,472,1524];
const BOSS_VISUAL_H=232;
const FLOSS_DURATION=5.8;
const FLOSS_VISUAL_H=188;
const FLOSS_POSES=Object.freeze([
  Object.freeze({sheet:0,bounds:[176,44,976,1404]}),
  Object.freeze({sheet:1,bounds:[264,20,1048,1420]})
]);

function loadAsset(url,chroma=false){
  const img=new Image();
  img.decoding='async';
  const state={img,source:img,ready:false};
  img.addEventListener('load',()=>{
    state.source=chroma?removeWhiteMatte(img):img;
    state.ready=true;
  });
  img.src=url;
  return state;
}

function removeWhiteMatte(img){
  const canvas=document.createElement('canvas');
  canvas.width=img.naturalWidth;
  canvas.height=img.naturalHeight;
  const c=canvas.getContext('2d',{willReadFrequently:true});
  c.drawImage(img,0,0);
  const data=c.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<data.data.length;i+=4){
    const r=data.data[i],g=data.data[i+1],b=data.data[i+2];
    const min=Math.min(r,g,b),max=Math.max(r,g,b),spread=max-min;
    if(min>=246&&spread<=12)data.data[i+3]=0;
    else if(min>224&&spread<=18)data.data[i+3]=Math.round(clamp((246-min)/22,0,1)*255);
  }
  c.putImageData(data,0,0);
  return canvas;
}

const backgroundAsset=loadAsset(BG_URL,false);
const heroWalkAsset=loadAsset(HERO_WALK_URL,false);
const heroMeleeAssets=Object.fromEntries(
  Object.entries(HERO_MELEE_POSES).map(([k,[url,bounds]])=>[k,{asset:loadAsset(url,false),bounds}])
);
const bossAssets=Object.fromEntries(Object.entries(BOSS_URLS).map(([k,url])=>[k,loadAsset(url,false)]));
const ladderAsset=loadAsset(LADDER_URL,false);
const flossAssets=[
  loadAsset(FLOSS_A_URL,false),
  loadAsset(FLOSS_B_URL,false)
];
const flossPoses=FLOSS_POSES.map(p=>({asset:flossAssets[p.sheet],bounds:p.bounds}));

function scaledFrame(frame,asset,base){
  const source=asset.source;
  const sx=(source.width||asset.img.naturalWidth)/base.w;
  const sy=(source.height||asset.img.naturalHeight)/base.h;
  return [frame[0]*sx,frame[1]*sy,frame[2]*sx,frame[3]*sy];
}

function drawSprite(ctx,asset,base,frame,x,feetY,facing,displayH,alpha=1){
  if(!asset.ready)return false;
  const [sx,sy,sw,sh]=scaledFrame(frame,asset,base);
  const dw=displayH*(sw/sh);
  ctx.save();
  ctx.globalAlpha*=alpha;
  ctx.translate(x,feetY);
  ctx.scale(facing,1);
  ctx.drawImage(asset.source,sx,sy,sw,sh,-dw/2,-displayH,dw,displayH);
  ctx.restore();
  return true;
}

function drawRawSprite(ctx,asset,frame,x,feetY,facing,displayH,alpha=1){
  if(!asset.ready)return false;
  const [sx,sy,sw,sh]=frame;
  const dw=displayH*(sw/sh);
  ctx.save();
  ctx.globalAlpha*=alpha;
  ctx.translate(x,feetY);
  ctx.scale(facing,1);
  ctx.drawImage(asset.source,sx,sy,sw,sh,-dw/2,-displayH,dw,displayH);
  ctx.restore();
  return true;
}

function drawBoundedAsset(ctx,entry,x,feetY,facing,displayH,alpha=1){
  if(!entry?.asset?.ready)return false;
  const [l,t,r,b]=entry.bounds,sw=r-l,sh=b-t,dw=displayH*(sw/sh);
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,feetY);ctx.scale(facing,1);
  ctx.drawImage(entry.asset.source,l,t,sw,sh,-dw/2,-displayH,dw,displayH);
  ctx.restore();return true;
}
function drawFrameSet(ctx,asset,anim,index,x,feetY,facing,displayH,alpha=1){
  if(!asset?.ready)return false;
  const box=anim.boxes[Math.max(0,Math.min(anim.boxes.length-1,index))];
  const [l,t,r,b]=box,sw=r-l,sh=b-t,scale=displayH/anim.refH;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,feetY);ctx.scale(facing,1);
  ctx.drawImage(asset.source,l,t,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);
  ctx.restore();return true;
}
function phaseIndex(elapsed,duration,count){
  return Math.min(count-1,Math.max(0,Math.floor(elapsed/Math.max(.001,duration)*count)));
}

export function drawRooftopLadder(ctx,{x=ROOFTOP_LADDER_X,bottomY,unlocked=false,time=0}){
  const displayH=184;
  ctx.save();
  ctx.globalAlpha=unlocked?1:.50;
  ctx.shadowColor=unlocked?'#61ffa7':'#ff3d49';
  ctx.shadowBlur=unlocked?13:7;
  if(!drawSprite(ctx,ladderAsset,LADDER_BASE,LADDER_FRAME,x,bottomY,1,displayH)){
    const top=bottomY-displayH,w=48;
    ctx.strokeStyle=unlocked?'#b7c8d5':'#59636c';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bottomY);
    ctx.moveTo(x+w/2,top);ctx.lineTo(x+w/2,bottomY);ctx.stroke();
    ctx.lineWidth=3;
    for(let y=top+18;y<bottomY-7;y+=23){ctx.beginPath();ctx.moveTo(x-w/2+3,y);ctx.lineTo(x+w/2-3,y);ctx.stroke();}
  }
  ctx.globalAlpha=.62+Math.sin(time*4)*.20;
  ctx.fillStyle=unlocked?'#61ffa7':'#ff3d49';
  ctx.shadowBlur=12;ctx.fillRect(x-5,bottomY-displayH-13,10,7);
  ctx.restore();
}
export function drawRooftopClimber(ctx,{x,feetY,time=0,facing=1}){
  const bob=Math.sin(time*11)*1.4;
  if(drawBoundedAsset(ctx,heroMeleeAssets.climb,x,feetY+bob,facing,94))return;
  ctx.save();ctx.fillStyle='#d23b3f';ctx.fillRect(x-13,feetY-72,26,72);ctx.restore();
}

export function createRooftopBattle(ctx,{width=720,height=1280}={}){
  const BG_Y=560;
  const FLOOR_Y=984;
  const ARENA_LEFT=115;
  const ARENA_RIGHT=1330;
  const HERO_MAX_HP=5;
  const BOSS_MAX_HP=12;

  let mode='idle',timer=0,cameraX=0,attackIndex=0,bossAttackIndex=0;
  let lastShoot=false,lastHeavy=false,lastDash=false;
  const hero={x:250,hp:HERO_MAX_HP,maxHp:HERO_MAX_HP,facing:1,attack:null,attackTime:0,attackHit:false,cooldown:0,hit:0,dodge:0,invulnerable:0,walk:false};
  const boss={x:825,hp:BOSS_MAX_HP,maxHp:BOSS_MAX_HP,facing:-1,attack:null,attackTime:0,attackHit:false,cooldown:.9,hit:0,block:0,walk:false};

  function reset(heroHp=HERO_MAX_HP){
    mode='idle';timer=0;cameraX=0;attackIndex=0;bossAttackIndex=0;
    hero.x=250;hero.hp=clamp(heroHp,1,HERO_MAX_HP);hero.maxHp=HERO_MAX_HP;hero.facing=1;hero.attack=null;hero.attackTime=0;hero.attackHit=false;hero.cooldown=0;hero.hit=0;hero.dodge=0;hero.invulnerable=0;hero.walk=false;
    boss.x=825;boss.hp=BOSS_MAX_HP;boss.maxHp=BOSS_MAX_HP;boss.facing=-1;boss.attack=null;boss.attackTime=0;boss.attackHit=false;boss.cooldown=.9;boss.hit=0;boss.block=0;boss.walk=false;
    lastShoot=lastHeavy=lastDash=false;
  }

  function start(heroHp=HERO_MAX_HP){
    reset(heroHp);
    hero.hp=Math.max(3,hero.hp);
    mode='intro';
  }

  function startFight(){
    mode='fight';timer=0;
    hero.x=340;boss.x=780;
    hero.hp=HERO_MAX_HP;
    boss.hp=BOSS_MAX_HP;
    hero.attack=null;hero.hit=0;hero.dodge=0;hero.invulnerable=.7;
    boss.attack=null;boss.hit=0;boss.block=0;boss.cooldown=.8;
  }

  function restartFight(){
    hero.x=340;hero.hp=HERO_MAX_HP;hero.attack=null;hero.attackTime=0;hero.hit=0;hero.dodge=0;hero.invulnerable=1.2;hero.cooldown=0;
    boss.x=780;boss.hp=BOSS_MAX_HP;boss.attack=null;boss.attackTime=0;boss.hit=0;boss.block=0;boss.cooldown=1.0;
    mode='fight';timer=0;
  }

  function startHeroAttack(name){
    if(hero.attack||hero.hit>0||hero.dodge>0||hero.cooldown>0)return false;
    hero.attack=name;hero.attackTime=0;hero.attackHit=false;
    hero.cooldown=name==='heavy'?.62:.28;
    return true;
  }

  function hitBoss(damage,reach,events){
    if(hero.attackHit)return;
    hero.attackHit=true;
    if(Math.abs(boss.x-hero.x)>reach)return;
    const inFront=hero.facing>0?boss.x>=hero.x:boss.x<=hero.x;
    if(!inFront)return;
    if(boss.block>0){events.push('boss-block');return;}
    boss.hp=Math.max(0,boss.hp-damage);
    boss.hit=.24;
    boss.x=clamp(boss.x+hero.facing*(damage>=3?42:28),ARENA_LEFT,ARENA_RIGHT);
    events.push('boss-hit');
    if(boss.hp<=0){
      boss.attack=null;boss.block=0;boss.walk=false;
      mode='boss-defeat';timer=0;
      events.push('boss-defeated');
    }
  }

  function hitHero(damage,events){
    if(hero.invulnerable>0||hero.dodge>0||mode!=='fight')return;
    hero.hp=Math.max(0,hero.hp-damage);
    hero.hit=.34;hero.invulnerable=.72;hero.attack=null;
    hero.x=clamp(hero.x-boss.facing*(damage===2?54:32),ARENA_LEFT,ARENA_RIGHT);
    events.push('hero-hit');
    if(hero.hp<=0){
      mode='hero-ko';timer=0;
      events.push('hero-defeated');
    }
  }

  function tickHero(dt,input,events){
    hero.cooldown=Math.max(0,hero.cooldown-dt);
    hero.hit=Math.max(0,hero.hit-dt);
    hero.dodge=Math.max(0,hero.dodge-dt);
    hero.invulnerable=Math.max(0,hero.invulnerable-dt);
    const shootPressed=!!input.shoot&&!lastShoot;
    const heavyPressed=!!input.jump&&!lastHeavy;
    const dodgePressed=!!input.dash&&!lastDash;
    lastShoot=!!input.shoot;lastHeavy=!!input.jump;lastDash=!!input.dash;

    hero.facing=boss.x>=hero.x?1:-1;
    hero.walk=false;
    if(dodgePressed&&!hero.attack&&hero.hit<=0&&hero.dodge<=0){
      hero.dodge=.28;hero.invulnerable=.34;
      hero.x=clamp(hero.x-hero.facing*95,ARENA_LEFT,ARENA_RIGHT);
      events.push('hero-dodge');
    }
    if(shootPressed){
      attackIndex++;
      startHeroAttack(attackIndex%2?'punch1':'punch2');
    }
    if(heavyPressed)startHeroAttack('heavy');

    if(hero.attack){
      hero.attackTime+=dt;
      if(hero.attack==='heavy'){
        if(hero.attackTime>=.27&&!hero.attackHit)hitBoss(3,135,events);
        if(hero.attackTime>=.56)hero.attack=null;
      }else{
        if(hero.attackTime>=.10&&!hero.attackHit)hitBoss(2,115,events);
        if(hero.attackTime>=.27)hero.attack=null;
      }
      return;
    }
    if(hero.hit>0||hero.dodge>0)return;

    const axis=Number(input.right)-Number(input.left);
    if(axis){
      hero.x=clamp(hero.x+axis*225*dt,ARENA_LEFT,ARENA_RIGHT);
      hero.walk=true;
    }
  }

  function chooseBossAttack(){
    bossAttackIndex++;
    if(bossAttackIndex%6===0){boss.block=.48;boss.cooldown=.72;return;}
    boss.attack=bossAttackIndex%4===0?'heavy':bossAttackIndex%2?'attack1':'attack2';
    boss.attackTime=0;boss.attackHit=false;
  }

  function tickBoss(dt,events){
    boss.hit=Math.max(0,boss.hit-dt);
    boss.block=Math.max(0,boss.block-dt);
    boss.cooldown=Math.max(0,boss.cooldown-dt);
    boss.facing=hero.x>=boss.x?1:-1;
    boss.walk=false;
    if(mode!=='fight'||boss.hp<=0)return;

    if(boss.attack){
      boss.attackTime+=dt;
      const heavy=boss.attack==='heavy';
      const active=heavy?.48:.26;
      const duration=heavy?.82:.54;
      const reach=heavy?150:124;
      if(boss.attackTime>=active&&!boss.attackHit){
        boss.attackHit=true;
        if(Math.abs(hero.x-boss.x)<=reach)hitHero(heavy?2:1,events);
      }
      if(boss.attackTime>=duration){
        boss.attack=null;
        boss.cooldown=heavy?1.05:.68;
      }
      return;
    }
    if(boss.block>0||boss.hit>0)return;

    const distance=Math.abs(hero.x-boss.x);
    const enraged=boss.hp<=Math.ceil(BOSS_MAX_HP*.45);
    if(distance>126){
      boss.x=clamp(boss.x+boss.facing*(enraged?156:116)*dt,ARENA_LEFT,ARENA_RIGHT);
      boss.walk=true;
      return;
    }
    if(boss.cooldown<=0)chooseBossAttack();
  }

  function updateCamera(dt){
    const focus=mode==='dance'||mode==='complete'?hero.x:(hero.x+boss.x)/2;
    const target=clamp(focus-width*.5,0,1448-width);
    cameraX+=(target-cameraX)*(1-Math.exp(-5*dt));
  }

  function tick(dt,input={left:false,right:false,jump:false,dash:false,shoot:false}){
    const events=[];
    timer+=dt;
    if(mode==='idle'||mode==='complete')return events;

    if(mode==='intro'){
      if(timer<1.35){
        boss.x=lerp(900,815,ease(timer/1.35));
        boss.walk=true;
      }else boss.walk=false;
      if(timer>=3.45){
        startFight();
        events.push('fight-start');
      }
      updateCamera(dt);
      return events;
    }

    if(mode==='hero-ko'){
      if(timer>=1.55){
        restartFight();
        events.push('fight-restart');
      }
      updateCamera(dt);
      return events;
    }

    if(mode==='boss-defeat'){
      if(timer>=1.05){
        mode='dance';timer=0;
        hero.attack=null;hero.hit=0;hero.dodge=0;hero.walk=false;hero.facing=1;
        hero.x=clamp(hero.x,ARENA_LEFT+110,ARENA_RIGHT-110);
        events.push('dance-start');
      }
      updateCamera(dt);
      return events;
    }

    if(mode==='dance'){
      hero.walk=false;hero.attack=null;hero.hit=0;hero.dodge=0;
      if(timer>=FLOSS_DURATION){
        mode='complete';timer=0;
        events.push('dance-finished');
      }
      updateCamera(dt);
      return events;
    }

    tickHero(dt,input,events);
    if(mode==='fight')tickBoss(dt,events);
    updateCamera(dt);
    return events;
  }

  function drawVictoryDance(){
    const index=Math.floor(timer*5.5)%flossPoses.length;
    return drawBoundedAsset(ctx,flossPoses[index],hero.x,FLOOR_Y,1,FLOSS_VISUAL_H);
  }

  function drawHeroSprite(time,facing){
    if(mode==='dance'||mode==='complete')return drawVictoryDance();
    let state='idle';
    if(mode==='intro'&&timer>2.18&&timer<2.72)state='hurt';
    else if(mode==='hero-ko'||hero.hit>0)state='hurt';
    else if(hero.dodge>0)state='dodge';
    else if(hero.attack)state=hero.attack;
    else if(hero.walk){
      const frame=HERO_WALK_FRAMES[Math.floor(time*7.5)%HERO_WALK_FRAMES.length];
      const walkScale=188/307;
      if(drawRawSprite(ctx,heroWalkAsset,frame,hero.x,FLOOR_Y,facing,frame[3]*walkScale))return true;
      state='walk';
    }
    const entry=heroMeleeAssets[state]??heroMeleeAssets.idle;
    const visualH=state==='dodge'?118:188;
    return drawBoundedAsset(ctx,entry,hero.x,FLOOR_Y,facing,visualH);
  }

  function drawBossSprite(time,facing){
    let state='idle',index=0;
    if(mode==='boss-defeat'||boss.hp<=0){
      state='defeat';
      index=phaseIndex(timer,1.05,BOSS_ANIMS.defeat.boxes.length);
    }else if(boss.hit>0){
      state='hurt';
      index=phaseIndex(.24-boss.hit,.24,BOSS_ANIMS.hurt.boxes.length);
    }else if(boss.block>0){
      state='block';
      index=phaseIndex(.48-boss.block,.48,BOSS_ANIMS.block.boxes.length);
    }else if(boss.attack){
      state=boss.attack;
      const duration=state==='heavy'?.82:.54;
      index=phaseIndex(boss.attackTime,duration,BOSS_ANIMS[state].boxes.length);
    }else if(boss.walk){
      state='walk';
      index=Math.floor(time*6.4)%BOSS_ANIMS.walk.boxes.length;
    }else{
      index=Math.floor(time*3.2)%BOSS_ANIMS.idle.boxes.length;
    }
    return drawFrameSet(ctx,bossAssets[state],BOSS_ANIMS[state],index,boss.x,FLOOR_Y,facing,BOSS_VISUAL_H);
  }

  function drawSky(){
    const g=ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0,'#09101d');g.addColorStop(.52,'#111827');g.addColorStop(1,'#03060c');
    ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  }

  function drawBackground(){
    ctx.save();
    ctx.translate(-cameraX,0);
    if(backgroundAsset.ready){
      ctx.drawImage(backgroundAsset.source,0,BG_Y,1448,536);
    }else{
      ctx.fillStyle='#121b29';ctx.fillRect(0,BG_Y,1448,536);
    }
    ctx.fillStyle='#05070c';
    ctx.fillRect(0,BG_Y+515,1448,height-(BG_Y+515));
    if(mode==='dance'){
      ctx.save();
      const glow=.12+.05*Math.sin(timer*8);
      ctx.globalAlpha=glow;
      ctx.fillStyle='#ffd66b';
      ctx.fillRect(cameraX,0,width,536);
      ctx.restore();
    }
    ctx.restore();
  }

  function rainHash(n){
    const v=Math.sin(n*12.9898+78.233)*43758.5453;
    return v-Math.floor(v);
  }

  function drawRainLayer(time,{count,speed,length,alpha,lineWidth,wind,seed}){
    ctx.save();
    ctx.strokeStyle='#d6e8ff';
    ctx.lineCap='round';
    ctx.lineWidth=lineWidth;
    const travel=height+90;
    for(let i=0;i<count;i++){
      const h1=rainHash(seed+i*3.17),h2=rainHash(seed+i*7.91),h3=rainHash(seed+i*11.43);
      const y=(h2*travel+time*speed)%travel-45;
      const x=h1*(width+170)-85+Math.sin(time*.25+h3*6.28)*7;
      const drop=length*(.72+h3*.42);
      ctx.globalAlpha=alpha*(.62+h2*.38);
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+wind,y+drop);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRain(time){
    // Three restrained depth layers: fine distant rain, readable middle rain,
    // and only a few foreground streaks. This avoids the old uniform "scratch" look.
    drawRainLayer(time,{count:72,speed:360,length:10,alpha:.085,lineWidth:.55,wind:-2.2,seed:13});
    drawRainLayer(time,{count:46,speed:575,length:15,alpha:.14,lineWidth:.72,wind:-3.6,seed:71});
    drawRainLayer(time,{count:20,speed:820,length:22,alpha:.19,lineWidth:.95,wind:-5.2,seed:151});

    // Fine wet haze immediately above the roof surface.
    const haze=ctx.createLinearGradient(0,FLOOR_Y-125,0,FLOOR_Y+18);
    haze.addColorStop(0,'rgba(180,210,236,0)');
    haze.addColorStop(1,'rgba(180,210,236,.035)');
    ctx.fillStyle=haze;ctx.fillRect(0,FLOOR_Y-125,width,143);

    // Sparse shallow ripples where drops meet the wet roof.
    ctx.save();
    ctx.strokeStyle='#c8e0f6';ctx.lineWidth=.7;
    for(let i=0;i<10;i++){
      const phase=(time*(1.05+rainHash(i+230)*.35)+rainHash(i+310))%1;
      if(phase>.24)continue;
      const p=phase/.24,x=rainHash(i+410)*width;
      ctx.globalAlpha=(1-p)*.12;
      ctx.beginPath();
      ctx.ellipse(x,FLOOR_Y+2,2+p*10,.6+p*1.8,0,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawIntroWeapon(){
    if(mode!=='intro'||timer<2.08||timer>3.05)return;
    const t=clamp((timer-2.08)/.97,0,1);
    const x=lerp(hero.x+38,115,t)-cameraX;
    const y=lerp(FLOOR_Y-118,FLOOR_Y-42,t)-Math.sin(t*Math.PI)*120;
    ctx.save();ctx.translate(x,y);ctx.rotate(-1.2+t*5.8);
    ctx.fillStyle='#10151a';ctx.strokeStyle='#5e6b75';ctx.lineWidth=2;
    ctx.fillRect(-31,-5,62,10);ctx.strokeRect(-31,-5,62,10);
    ctx.fillRect(10,-11,19,6);ctx.restore();
  }

  function draw(time){
    drawSky();
    drawBackground();

    ctx.save();
    ctx.translate(-cameraX,0);
    const heroFacing=boss.x>=hero.x?1:-1;
    const bossFacing=hero.x>=boss.x?1:-1;
    const bossVisible=mode!=='dance'&&mode!=='complete';

    ctx.globalAlpha=.24;ctx.fillStyle='#020407';
    ctx.beginPath();ctx.ellipse(hero.x,FLOOR_Y+3,54,8,0,0,Math.PI*2);ctx.fill();
    if(bossVisible){ctx.beginPath();ctx.ellipse(boss.x,FLOOR_Y+4,72,10,0,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;

    if(!drawHeroSprite(time,heroFacing)){
      ctx.fillStyle='#b73339';ctx.fillRect(hero.x-20,FLOOR_Y-100,40,100);
    }
    if(bossVisible&&!drawBossSprite(time,bossFacing)){
      ctx.fillStyle='#37151b';ctx.fillRect(boss.x-28,FLOOR_Y-145,56,145);
    }
    ctx.restore();

    drawIntroWeapon();
    drawRain(time);

    const lightning=Math.max(0,(Math.sin(time*1.31)+Math.sin(time*3.73)-1.72)*1.8);
    if(lightning>0){
      ctx.save();ctx.globalAlpha=Math.min(.22,lightning*.18);ctx.fillStyle='#d8e6ff';ctx.fillRect(0,0,width,height);ctx.restore();
    }

    if(mode==='intro'){
      ctx.save();
      ctx.textAlign='center';ctx.fillStyle='#f4f7fb';ctx.shadowColor='#000';ctx.shadowBlur=10;
      ctx.font='900 15px system-ui';ctx.fillText('FINAL ENCOUNTER',width/2,115);
      if(timer>2.15){ctx.fillStyle='#ff5d68';ctx.font='900 12px system-ui';ctx.fillText('السلاح خارج المعركة',width/2,142);}
      ctx.restore();
    }
    if(mode==='dance'){
      ctx.save();
      ctx.textAlign='center';
      ctx.shadowColor='#000';ctx.shadowBlur=12;
      ctx.fillStyle='#ffd66b';ctx.font='900 18px system-ui';
      ctx.fillText('VICTORY DANCE',width/2,126);
      ctx.fillStyle='#f5f7fa';ctx.font='800 11px system-ui';
      ctx.fillText('FLOSS!',width/2,149);
      ctx.restore();
    }
  }

  function finish(){
    mode='complete';timer=0;
  }

  function stats(){
    return {mode,heroHp:hero.hp,heroMax:hero.maxHp,bossHp:boss.hp,bossMax:boss.maxHp,cameraX,heroX:hero.x,bossX:boss.x};
  }

  return {reset,start,tick,draw,finish,stats,get mode(){return mode;}};
}
