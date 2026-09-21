const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

export const ROOFTOP_LADDER_X=204;

const BG_URL='./assets/stage2/rooftop/E254AA9A-004F-4581-B58B-1FF6F0427114.jpeg';
const HERO_URL='./assets/stage2/rooftop/B78F8298-AC6E-4984-8171-6060AD95C1AD.png';
const HERO_WALK_URL='./assets/aboden-hero-movement.png';
const BOSS_URL='./assets/stage2/rooftop/0D1BD2D4-2C58-41AD-87C6-AF3454DDCD3D.png';

const HERO_BASE={w:1536,h:1024};
const BOSS_BASE={w:1122,h:1402};

const HERO_WALK_FRAMES=Object.freeze([
  [6,42,206,306],[194,42,209,307],[402,43,196,304],[583,38,239,309],
  [808,42,208,306],[1008,39,208,310],[1220,43,211,306],[1436,42,217,307]
]);

const HERO_FRAMES=Object.freeze({
  climb:[[59,8,264,445],[477,9,171,443],[738,18,305,442],[1132,23,338,409]],
  idle:[[19,429,234,298]],
  walk:[[278,433,255,292]],
  punch1:[[545,432,353,295]],
  punch2:[[869,420,332,306]],
  heavy:[[1216,420,297,314]],
  hurt:[[27,749,258,261]],
  block:[[342,736,313,274]],
  dodge:[[691,751,384,258]],
  win:[[1216,720,233,290]]
});

const BOSS_FRAMES=Object.freeze({
  idle:[[110,0,390,410]],
  walk:[[572,2,421,397]],
  attack1:[[61,422,467,343]],
  attack2:[[587,414,484,351]],
  heavy:[[82,753,496,334]],
  hurt:[[661,759,393,338]],
  block:[[99,1091,403,294]],
  defeat:[[561,1127,496,253]]
});

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
const heroAsset=loadAsset(HERO_URL,true);
const heroWalkAsset=loadAsset(HERO_WALK_URL,false);
const bossAsset=loadAsset(BOSS_URL,true);

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

export function drawRooftopLadder(ctx,{x=ROOFTOP_LADDER_X,bottomY,unlocked=false,time=0}){
  const top=74,bottom=bottomY-5,w=42;
  ctx.save();
  ctx.lineCap='round';
  ctx.lineWidth=5;
  ctx.strokeStyle=unlocked?'#b7c8d5':'#59636c';
  ctx.shadowColor=unlocked?'#61ffa7':'#ff3d49';
  ctx.shadowBlur=unlocked?11:5;
  ctx.beginPath();
  ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bottom);
  ctx.moveTo(x+w/2,top);ctx.lineTo(x+w/2,bottom);
  ctx.stroke();
  ctx.lineWidth=3;
  for(let y=top+18;y<bottom-7;y+=23){
    ctx.beginPath();ctx.moveTo(x-w/2+3,y);ctx.lineTo(x+w/2-3,y);ctx.stroke();
  }
  ctx.fillStyle=unlocked?'#61ffa7':'#ff3d49';
  ctx.shadowBlur=12;
  const pulse=.62+Math.sin(time*4)*.22;
  ctx.globalAlpha=pulse;
  ctx.fillRect(x-5,top-16,10,7);
  ctx.restore();
}

export function drawRooftopClimber(ctx,{x,feetY,time=0,facing=1}){
  const frames=HERO_FRAMES.climb;
  const frame=frames[Math.floor(time*5.5)%frames.length];
  if(drawSprite(ctx,heroAsset,HERO_BASE,frame,x,feetY,facing,94))return;
  ctx.save();ctx.fillStyle='#d23b3f';ctx.fillRect(x-13,feetY-72,26,72);ctx.restore();
}

export function createRooftopBattle(ctx,{width=720,height=1280}={}){
  const BG_Y=560;
  const FLOOR_Y=1048;
  const ARENA_LEFT=115;
  const ARENA_RIGHT=1330;
  const CONTROL_ROOM_X=626;
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
    const focus=mode==='after'?hero.x:(hero.x+boss.x)/2;
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
      if(timer>=1.65){
        mode='after';timer=0;
        hero.attack=null;hero.hit=0;hero.dodge=0;
        events.push('after-ready');
      }
      updateCamera(dt);
      return events;
    }

    if(mode==='after'){
      hero.walk=false;
      const axis=Number(input.right)-Number(input.left);
      if(axis){
        hero.x=clamp(hero.x+axis*225*dt,ARENA_LEFT,ARENA_RIGHT);
        hero.facing=axis;
        hero.walk=true;
      }
      updateCamera(dt);
      return events;
    }

    tickHero(dt,input,events);
    if(mode==='fight')tickBoss(dt,events);
    updateCamera(dt);
    return events;
  }

  function heroFrame(){
    if(mode==='intro'&&timer>2.18&&timer<2.72)return HERO_FRAMES.hurt[0];
    if(mode==='hero-ko'||hero.hit>0)return HERO_FRAMES.hurt[0];
    if(mode==='after'&&!hero.walk)return HERO_FRAMES.win[0];
    if(hero.dodge>0)return HERO_FRAMES.dodge[0];
    if(hero.attack)return HERO_FRAMES[hero.attack][0];
    if(hero.walk)return HERO_FRAMES.walk[0];
    return HERO_FRAMES.idle[0];
  }

  function drawHeroSprite(time,facing){
    if(hero.walk&&!hero.attack&&hero.hit<=0&&hero.dodge<=0&&mode!=='hero-ko'){
      const frame=HERO_WALK_FRAMES[Math.floor(time*7.5)%HERO_WALK_FRAMES.length];
      if(drawRawSprite(ctx,heroWalkAsset,frame,hero.x,FLOOR_Y,facing,188))return true;
    }
    return drawSprite(ctx,heroAsset,HERO_BASE,heroFrame(),hero.x,FLOOR_Y,facing,188);
  }

  function bossFrame(){
    if(mode==='boss-defeat'||mode==='after'||boss.hp<=0)return BOSS_FRAMES.defeat[0];
    if(boss.hit>0)return BOSS_FRAMES.hurt[0];
    if(boss.block>0)return BOSS_FRAMES.block[0];
    if(boss.attack)return BOSS_FRAMES[boss.attack][0];
    if(boss.walk)return BOSS_FRAMES.walk[0];
    return BOSS_FRAMES.idle[0];
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
    if(mode==='after'||mode==='complete'){
      ctx.save();
      ctx.globalAlpha=.8+.2*Math.sin(timer*5);
      ctx.fillStyle='#61ffa7';
      ctx.shadowColor='#61ffa7';ctx.shadowBlur=18;
      ctx.fillRect(CONTROL_ROOM_X-7,918,14,8);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawRain(time){
    ctx.save();
    ctx.strokeStyle='rgba(191,220,255,.34)';
    ctx.lineWidth=1.2;
    for(let i=0;i<62;i++){
      const x=(i*113+(time*360)%900)%900-90;
      const y=(i*173+(time*690)%1380)%1380-70;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-9,y+34);ctx.stroke();
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
    const heroFacing=mode==='after'&&hero.walk?hero.facing:(boss.x>=hero.x?1:-1);
    const bossFacing=hero.x>=boss.x?1:-1;

    ctx.globalAlpha=.24;ctx.fillStyle='#020407';
    ctx.beginPath();ctx.ellipse(hero.x,FLOOR_Y+3,54,8,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(boss.x,FLOOR_Y+4,72,10,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    if(!drawHeroSprite(time,heroFacing)){
      ctx.fillStyle='#b73339';ctx.fillRect(hero.x-20,FLOOR_Y-100,40,100);
    }
    if(!drawSprite(ctx,bossAsset,BOSS_BASE,bossFrame(),boss.x,FLOOR_Y,bossFacing,248)){
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
  }

  function canEnterControlRoom(){
    return mode==='after'&&Math.abs(hero.x-CONTROL_ROOM_X)<=95;
  }

  function finish(){
    mode='complete';timer=0;
  }

  function stats(){
    return {mode,heroHp:hero.hp,heroMax:hero.maxHp,bossHp:boss.hp,bossMax:boss.maxHp,cameraX,heroX:hero.x,bossX:boss.x};
  }

  return {reset,start,tick,draw,canEnterControlRoom,finish,stats,get mode(){return mode;}};
}
