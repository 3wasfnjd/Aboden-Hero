import {lockSafariZoom} from './gesture-lock.js?v=20260921-safari-lock-1';
import {clamp,overlaps,createPlayer,stepPlayer} from './world.js?v=20260916-action-1';
import {SHOT_INTERVAL,makeHeroBullet,bulletTargetBounds} from './hero-weapon.js?v=20260921-cleanup-1';
import {stepCombat} from './combat.js?v=20260921-cleanup-1';
import {createArt} from './art.js?v=20260921-cleanup-1';
import {createMusic} from './music.js?v=20260917-music-1';
import {createMatchingPuzzle} from '../puzzle-kit/matching/matching.js?v=20260920-stage2-embed-1';
import {createWiringPuzzle} from '../puzzle-kit/wiring/wiring.js?v=20260919-stage2-embed-2';
import {createCubesPuzzle} from '../puzzle-kit/cubes/cubes.js?v=20260920-stage2-embed-1';
import {
  FLOOR_DEFS,FLOOR_COUNT,createProgress,completeFloor,beginElevator,updateElevator
} from './stage2-state.js?v=20260921-cleanup-1';
import {
  TOWER_WIDTH,TOWER_HEIGHT,FLOOR_LEFT,FLOOR_RIGHT,
  ELEVATOR_WIDTH,ELEVATOR_PLATFORM_HEIGHT,
  groundY,makeFloorPlatforms,elevatorGround,puzzleInteraction,
  elevatorXForFloor,floorLabelX,floorLabelY,arrivalXForFloor
} from './stage2-tower.js?v=20260921-alternating-1';

lockSafariZoom();
const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d'),art=createArt(ctx);
const W=720,H=1280,STEP=1/120;
const WORLD_W=TOWER_WIDTH,WORLD_H=TOWER_HEIGHT;
const FIT_ZOOM=Math.min(W/WORLD_W,H/WORLD_H);
const GAME_ZOOM=1.90;
const INTRO_DURATION=3.8;
const ELEVATOR_DURATION=2.75;
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const smoother=t=>t*t*t*(t*(t*6-15)+10);
const viewW=zoom=>W/zoom;
const viewH=zoom=>H/zoom;

const keys=new Set(),touch=new Map(),buttons=[...document.querySelectorAll('[data-action]')];
let progress=createProgress(),player=createPlayer(arrivalXForFloor(1,30),groundY(1)-44),state='menu',time=0,elapsed=0;
let cameraX=0,cameraY=0,cameraZoom=FIT_ZOOM,introTime=0,introActive=false;
let bullets=[],enemyShots=[],particles=[],enemySets=new Map();
let kills=0,toastTime=0,accumulator=0,last=0,puzzleOpen=false;
let elevatorAuto=null,elevatorDockFloor=null,elevatorPendingFloor=null;
let activePuzzleModule=null,puzzleSession=0;
let muted=false,audio=null,musicCtl=null;


function loadImage(url){const img=new Image();img.decoding='async';if(url)img.src=url;return img;}
const towerBackground=loadImage('./assets/stage2/tower-background-with-puzzles.png?v=20260921-embedded-puzzles-1');
const elevatorPlatformImage=loadImage('./assets/ui/level/platform.png?v=20260921-stage2-elevator-1');

const floorPlatforms=makeFloorPlatforms();
const elevatorSolid={
  x:elevatorXForFloor(1),
  y:groundY(1),
  w:ELEVATOR_WIDTH,
  h:ELEVATOR_PLATFORM_HEIGHT,
  ground:true,
  oneWay:true
};
const solids=[...floorPlatforms,elevatorSolid];

function setElevatorGround(y){
  elevatorSolid.y=y;
  return y;
}
function setElevatorForFloor(floor){
  elevatorSolid.x=elevatorXForFloor(floor);
  elevatorSolid.y=groundY(floor);
  return elevatorSolid;
}
function currentElevatorCenter(){
  return elevatorSolid.x+ELEVATOR_WIDTH/2;
}
function activateAutoElevator(floor=progress.currentFloor){
  if(floor>=FLOOR_COUNT)return false;
  if(elevatorDockFloor===floor&&playerOnElevator(elevatorSolid.y)){
    elevatorPendingFloor=floor;
    return true;
  }
  elevatorDockFloor=null;elevatorPendingFloor=null;
  elevatorSolid.x=elevatorXForFloor(floor);
  elevatorSolid.y=groundY(floor);
  elevatorAuto={from:floor,to:floor+1,phase:0};
  return true;
}
function playerOnElevator(y=elevatorSolid.y){
  const feet=player.y+player.h;
  return player.x+player.w>elevatorSolid.x+6
    && player.x<elevatorSolid.x+elevatorSolid.w-6
    && Math.abs(feet-y)<=12
    && player.vy>=-40;
}
function fullTowerCamera(){
  const vw=viewW(FIT_ZOOM),vh=viewH(FIT_ZOOM);
  return {x:(WORLD_W-vw)/2,y:(WORLD_H-vh)/2};
}
function followTarget(zoom=GAME_ZOOM){
  const vw=viewW(zoom),vh=viewH(zoom);
  return {
    x:clamp(player.x+player.w/2-vw*.50,0,Math.max(0,WORLD_W-vw)),
    y:clamp(player.y+player.h/2-vh*.62,0,Math.max(0,WORLD_H-vh))
  };
}
function cameraCenter(camera,zoom){
  return {x:camera.x+viewW(zoom)/2,y:camera.y+viewH(zoom)/2};
}
function setIntroCamera(progress){
  const t=smoother(clamp(progress,0,1));
  const start=fullTowerCamera();
  const end=followTarget(GAME_ZOOM);
  const startCenter=cameraCenter(start,FIT_ZOOM);
  const endCenter=cameraCenter(end,GAME_ZOOM);
  cameraZoom=lerp(FIT_ZOOM,GAME_ZOOM,t);
  const centerX=lerp(startCenter.x,endCenter.x,t);
  const centerY=lerp(startCenter.y,endCenter.y,t);
  cameraX=centerX-viewW(cameraZoom)/2;
  cameraY=centerY-viewH(cameraZoom)/2;
}

function makeEnemy(kind,x,floor,index){
  const g=groundY(floor),span=kind==='sniper'?120:95;
  return {
    x,y:g-32,w:34,h:32,
    min:Math.max(FLOOR_LEFT+35,x-span),
    max:Math.min(FLOOR_RIGHT-35,x+span),
    vx:index%2?48:-48,hp:3,hit:0,fire:.9+index*.25,
    windup:0,aimX:0,aimY:0,kind,shotFlash:0
  };
}
function spawnFloorEnemies(floor){
  const def=FLOOR_DEFS[floor];
  if(def.type!=='combat'){enemySets.set(floor,[]);return;}
  const positions=def.enemies.length===2?[340,625]:[270,470,670];
  enemySets.set(floor,def.enemies.map((kind,i)=>makeEnemy(kind,positions[i],floor,i)));
}
function resetEnemies(){for(let f=1;f<=FLOOR_COUNT;f++)spawnFloorEnemies(f);}

function clearInput(){
  keys.clear();touch.clear();buttons.forEach(b=>b.classList.remove('held'));
  if(player){player.jumpHeld=false;player.dashHeld=false;player.buffer=0;}
}
function activeTouch(action){return [...touch.values()].includes(action);}
function input(){return {
  left:keys.has('ArrowLeft')||keys.has('KeyA')||activeTouch('left'),
  right:keys.has('ArrowRight')||keys.has('KeyD')||activeTouch('right'),
  jump:keys.has('ArrowUp')||keys.has('KeyK')||activeTouch('jump'),
  dash:keys.has('KeyL')||keys.has('ShiftLeft')||keys.has('ShiftRight')||activeTouch('dash'),
  shoot:keys.has('KeyJ')||keys.has('Space')||activeTouch('shoot')
};}

function sound(freq=440,duration=.08,type='sine',volume=.055){
  if(muted||!audio)return;
  const o=audio.createOscillator(),g=audio.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.62),audio.currentTime+duration);
  g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);
  o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
}
function unlockAudio(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});if(!musicCtl){musicCtl=createMusic(audio);musicCtl.start();}musicCtl.setMuted(false);}catch{muted=true;}}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');toastTime=2.5;}
function destroyActivePuzzle(){
  puzzleSession++;
  if(activePuzzleModule){
    try{activePuzzleModule.destroy();}catch{}
    activePuzzleModule=null;
  }
  $('puzzle-body')?.replaceChildren();
}
function burst(x,y,color='#6de0ff',count=8){for(let i=0;i<count;i++){const a=i*Math.PI*2/count;particles.push({x,y,vx:Math.cos(a)*(30+i*5),vy:Math.sin(a)*55-25,life:.45,max:.45,color});}}

function challengeLabel(){
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(done)return floor===FLOOR_COUNT?'النظام يعمل — اكتمل الفصل':'المصعد جاهز';
  if(def.type==='combat')return 'اقضِ على جميع الحراس';
  return def.puzzle==='match'?'صل الرموز المتطابقة':def.puzzle==='wiring'?'أكمل دائرة الطاقة':'رتّب المكعبات';
}
function updateHUD(){
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor];
  $('area-name').textContent=`الطابق ${floor} — ${def.title}`;
  $('area-progress').style.width=`${clamp(floor/FLOOR_COUNT*100,0,100)}%`;
  $('health').textContent='♥'.repeat(player.hp)+'♡'.repeat(5-player.hp);$('challenge').textContent=challengeLabel();
  $('hud').hidden=state!=='playing'||introActive;
}
function near(x,range=90){return Math.abs((player.x+player.w/2)-x)<=range;}
function currentPuzzleInteraction(){
  return puzzleInteraction(progress.currentFloor);
}
function updateAction(){
  const btn=$('action');btn.hidden=true;
  if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  const puzzleSpot=currentPuzzleInteraction();
  if(!done&&def.type==='puzzle'&&puzzleSpot&&near(puzzleSpot.x,puzzleSpot.range)){
    btn.textContent='فتح اللغز';btn.hidden=false;return;
  }
  // The elevator moves automatically after the floor challenge is complete.
}

function reset(){
  progress=createProgress();player=createPlayer(arrivalXForFloor(1,30),groundY(1)-44);player.facing=1;state='menu';time=0;elapsed=0;
  destroyActivePuzzle();bullets=[];enemyShots=[];particles=[];kills=0;puzzleOpen=false;
  elevatorAuto=null;elevatorDockFloor=null;elevatorPendingFloor=null;
  introTime=0;introActive=false;cameraZoom=FIT_ZOOM;
  const full=fullTowerCamera();cameraX=full.x;cameraY=full.y;
  setElevatorForFloor(1);
  $('puzzle').hidden=true;
  resetEnemies();clearInput();updateHUD();updateAction();
}
function setIntroCopy(){
  $('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02';
  $('overlay').querySelector('.eyebrow').textContent='ROOFTOP ELEVATOR';
  $('overlay').querySelector('h1').innerHTML='اصعد المبنى.<br><em>طابقًا بعد طابق.</em>';
  $('overlay-description').textContent='ستة طوابق مركبة فوق بعضها ومصعد واحد يربطها. أنهِ تحدي كل طابق لتشغيل المصعد.';
  $('play').textContent='ابدأ الفصل الثاني ◀';
}
function play(){
  unlockAudio();
  if(state==='menu'||state==='won')reset();
  state='playing';introActive=true;introTime=0;cameraZoom=FIT_ZOOM;
  const full=fullTowerCamera();cameraX=full.x;cameraY=full.y;
  $('overlay').hidden=true;$('controls').hidden=true;$('pause').textContent='Ⅱ';
  clearInput();last=performance.now();accumulator=0;updateHUD();updateAction();
}
function pause(){
  if(state==='playing'){state='paused';clearInput();$('overlay').hidden=false;$('overlay').querySelector('.chapter-tag').textContent='MISSION PAUSED';$('overlay').querySelector('.eyebrow').textContent='CHAPTER 02';$('overlay').querySelector('h1').innerHTML='المهمة<br><em>متوقفة.</em>';$('overlay-description').textContent='أكمل من نفس الطابق عندما تكون جاهزًا.';$('play').textContent='متابعة ◀';$('controls').hidden=true;$('hud').hidden=true;$('action').hidden=true;$('pause').textContent='▶';}
  else if(state==='paused'){state='playing';$('overlay').hidden=true;$('controls').hidden=introActive;$('pause').textContent='Ⅱ';last=performance.now();accumulator=0;updateHUD();}
}
function win(){
  state='won';clearInput();$('overlay').hidden=false;$('controls').hidden=true;$('hud').hidden=true;$('action').hidden=true;
  $('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02 COMPLETE';
  $('overlay').querySelector('.eyebrow').textContent='CONTROL ROOM ONLINE';
  $('overlay').querySelector('h1').innerHTML='وصلت للقمة.<br><em>النظام تحت سيطرتك.</em>';
  $('overlay-description').textContent=`أكملت الطوابق الستة وأسقطت ${kills} حراس. زمن المهمة ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}.`;
  $('play').textContent='إعادة الفصل الثاني ↻';sound(1080,.45,'triangle',.06);
}

function respawn(){
  const floor=progress.currentFloor;
  player=createPlayer(arrivalXForFloor(floor,30),groundY(floor)-44);
  player.facing=floor%2===1?1:-1;player.invulnerable=1.8;
  bullets=[];enemyShots=[];if(FLOOR_DEFS[floor].type==='combat'&&!progress.floors[floor].complete)spawnFloorEnemies(floor);
  elevatorAuto=null;elevatorDockFloor=null;elevatorPendingFloor=null;setElevatorForFloor(floor);
  toast('عدت إلى بداية الطابق');sound(170,.2,'triangle');updateHUD();
}
function hurt(){if(player.invulnerable>0||player.dashTime>0)return;player.hp--;player.invulnerable=1.25;burst(player.x+15,player.y+22,'#ff646d',10);sound(150,.16,'sawtooth',.04);if(player.hp<=0)respawn();else updateHUD();}
function finishChallenge(){
  const floor=progress.currentFloor;if(!completeFloor(progress,floor))return;
  enemyShots=[];bullets=[];burst(currentElevatorCenter(),groundY(floor)-36,'#61ffa7',24);sound(920,.26,'triangle',.055);
  if(floor===FLOOR_COUNT){toast('غرفة التحكم تعمل — اكتمل الفصل');setTimeout(()=>{if(state==='playing'&&progress.currentFloor===FLOOR_COUNT)win();},1150);}
  else activateAutoElevator(floor);
  updateHUD();updateAction();
}
function arriveNextFloor(){
  const floor=progress.currentFloor;
  const previousY=elevatorSolid.y;
  const gy=setElevatorGround(groundY(floor));
  // Continuous run: never recreate or snap the player at a floor transition.
  // Carry only the elevator's remaining vertical delta; X and player identity stay untouched.
  player.y+=gy-previousY;
  player.vy=0;player.grounded=true;player.invulnerable=.45;enemyShots=[];bullets=[];
  elevatorDockFloor=floor;
  sound(740,.18,'triangle');updateHUD();updateAction();
}

function tickCombat(dt){
  const floor=progress.currentFloor,enemies=enemySets.get(floor)??[];
  for(const e of enemies){
    if(e.hp<=0)continue;if(e.windup<=0)e.x+=e.vx*dt;e.hit=Math.max(0,e.hit-dt);
    if(e.x<e.min){e.x=e.min;e.vx=Math.abs(e.vx);}if(e.x+e.w>e.max){e.x=e.max-e.w;e.vx=-Math.abs(e.vx);}
    if(overlaps(player,e))hurt();
  }
  const dummyBoss={x:0,y:0,w:0,h:0,hp:0,maxHP:0,active:false,hit:0,fire:99,windup:0,aimX:0,aimY:0};
  for(const ev of stepCombat({enemies,boss:dummyBoss},player,enemyShots,dt,(e,isBoss)=>art.enemyMuzzle(e,time,isBoss)))if(ev==='hit')hurt();
  enemyShots=enemyShots.filter(s=>s.life>0);
  for(const b of bullets){
    b.x+=b.vx*dt;b.life-=dt;if(b.life<=0)continue;
    for(const e of enemies)if(e.hp>0&&overlaps(b,bulletTargetBounds(e))){
      b.life=0;e.hp--;e.hit=.12;burst(b.x,b.y,'#e6c878',5);
      if(e.hp<=0){kills++;burst(e.x+17,e.y+16,'#ef874f',14);sound(260,.12,'triangle');}
      break;
    }
  }
  bullets=bullets.filter(b=>b.life>0);
  if(!progress.floors[floor].complete&&enemies.length&&enemies.every(e=>e.hp<=0))finishChallenge();
}

function tickAutoElevator(dt){
  if(!elevatorAuto)return false;
  const auto=elevatorAuto;
  const previousY=elevatorSolid.y;
  const rider=playerOnElevator(previousY);
  auto.phase=(auto.phase+dt/ELEVATOR_DURATION)%2;
  const ascending=auto.phase<=1;
  const move=ascending?ease(auto.phase):ease(2-auto.phase);
  elevatorSolid.x=elevatorXForFloor(auto.from);
  const gy=setElevatorGround(elevatorGround(auto.from,auto.to,move));
  const dy=gy-previousY;

  if(rider){
    player.y+=dy;
    player.grounded=true;
    if(player.vy>0)player.vy=0;
  }

  if(rider&&ascending&&auto.phase>=.985){
    // Reuse the state-machine transition only when the rider reaches the next floor.
    if(beginElevator(progress)){
      updateElevator(progress,1);
      elevatorAuto=null;
      arriveNextFloor();
      return true;
    }
  }
  return false;
}

function tick(dt){
  if(state!=='playing'||puzzleOpen)return;
  time+=dt;

  if(introActive){
    introTime+=dt;
    const normalized=clamp(introTime/INTRO_DURATION,0,1);
    setIntroCamera(normalized);
    if(normalized>=1){
      introActive=false;
      cameraZoom=GAME_ZOOM;
      const target=followTarget(GAME_ZOOM);
      cameraX=target.x;cameraY=target.y;
      $('controls').hidden=false;updateHUD();updateAction();
    }
    return;
  }

  elapsed+=dt;
  if(elevatorAuto){
    if(tickAutoElevator(dt))return;
  }else if(elevatorDockFloor===null){
    setElevatorForFloor(progress.currentFloor);
  }
  const controls=input(),{jumped,landed}=stepPlayer(player,controls,solids,dt);
  if(elevatorDockFloor!==null&&!playerOnElevator(elevatorSolid.y)&&player.grounded){
    const pending=elevatorPendingFloor;
    elevatorDockFloor=null;elevatorPendingFloor=null;
    if(pending===progress.currentFloor)activateAutoElevator(progress.currentFloor);
    else setElevatorForFloor(progress.currentFloor);
  }
  player.x=clamp(player.x,FLOOR_LEFT,FLOOR_RIGHT-player.w);
  if(jumped){burst(player.x+15,player.y+44,'#d9d2b2',5);sound(500,.1,'triangle');}if(landed)burst(player.x+15,player.y+44,'#d9d2b2',4);
  if(player.y>groundY(progress.currentFloor)+150){respawn();return;}
  if(controls.shoot&&player.shot<=0){player.shot=SHOT_INTERVAL;bullets.push(makeHeroBullet(art.heroMuzzle(player,time),player.facing));sound(660,.055,'triangle',.035);}
  if(FLOOR_DEFS[progress.currentFloor].type==='combat'&&!progress.floors[progress.currentFloor].complete)tickCombat(dt);
  else{for(const b of bullets){b.x+=b.vx*dt;b.life-=dt;}bullets=bullets.filter(b=>b.life>0);enemyShots=[];}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
  cameraZoom+=(GAME_ZOOM-cameraZoom)*(1-Math.exp(-5*dt));
  const target=followTarget(cameraZoom);
  cameraX+=(target.x-cameraX)*(1-Math.exp(-7*dt));cameraY+=(target.y-cameraY)*(1-Math.exp(-7*dt));
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  updateHUD();updateAction();
}

function drawBackdrop(){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#050913');g.addColorStop(.52,'#080d17');g.addColorStop(1,'#020408');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

function floorSignalColor(floor){
  return progress.floors[floor]?.complete?'#61ffa7':'#ff3d49';
}

function drawFloorNumber(floor){
  const y=floorLabelY(floor),color=floorSignalColor(floor);
  const unlocked=progress.floors[floor]?.unlocked;
  ctx.save();
  ctx.globalAlpha=unlocked?1:.46;
  ctx.translate(floorLabelX(floor),y);
  ctx.fillStyle='rgba(7,8,12,.58)';
  ctx.strokeStyle=color;ctx.lineWidth=1.4;
  ctx.shadowColor=color;ctx.shadowBlur=unlocked?20:7;
  ctx.beginPath();ctx.roundRect(-31,-34,62,68,7);ctx.fill();ctx.stroke();
  ctx.shadowBlur=18;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 42px system-ui';ctx.fillText(String(floor),0,2);
  ctx.restore();
}

function drawElevatorPlatform(){
  const gy=elevatorSolid.y;
  const active=!!elevatorAuto||progress.floors[progress.currentFloor]?.complete;
  const color=active?'#61ffa7':'#ff3d49';
  ctx.save();
  ctx.shadowColor=color;ctx.shadowBlur=active?20:8;
  if(elevatorPlatformImage.complete&&elevatorPlatformImage.naturalWidth){
    const dw=ELEVATOR_WIDTH;
    const dh=elevatorPlatformImage.naturalHeight*(dw/elevatorPlatformImage.naturalWidth);
    ctx.drawImage(elevatorPlatformImage,elevatorSolid.x,gy-14,dw,dh);
  }else{
    ctx.fillStyle='rgba(14,22,31,.92)';
    ctx.fillRect(elevatorSolid.x,gy-10,ELEVATOR_WIDTH,14);
  }
  ctx.globalAlpha=active ? .88 : .62;
  ctx.fillStyle=color;
  ctx.fillRect(elevatorSolid.x+12,gy-4,ELEVATOR_WIDTH-24,3);
  ctx.restore();
}

const DEBUG_PLATFORMS=new URLSearchParams(location.search).has('platforms');
function drawCollisionDebug(){
  if(!DEBUG_PLATFORMS)return;
  ctx.save();ctx.globalAlpha=.45;ctx.fillStyle='#00ff9d';
  for(const solid of floorPlatforms)ctx.fillRect(solid.x,solid.y-2,solid.w,4);
  ctx.fillStyle='#00d9ff';ctx.fillRect(elevatorSolid.x,elevatorSolid.y-3,elevatorSolid.w,6);
  ctx.restore();
}

function drawTowerBackground(){
  if(towerBackground.complete&&towerBackground.naturalWidth){
    ctx.drawImage(towerBackground,0,0,WORLD_W,WORLD_H);
  }else{
    ctx.fillStyle='#0a111a';ctx.fillRect(0,0,WORLD_W,WORLD_H);
    ctx.fillStyle='#8da0b3';ctx.textAlign='center';ctx.font='800 18px system-ui';
    ctx.fillText('LOADING TOWER…',WORLD_W/2,WORLD_H/2);
  }
}

function drawWorld(){
  ctx.save();
  ctx.scale(cameraZoom,cameraZoom);
  ctx.translate(-cameraX,-cameraY);
  drawTowerBackground();

  for(let floor=1;floor<=FLOOR_COUNT;floor++)drawFloorNumber(floor);
  drawElevatorPlatform();
  drawCollisionDebug();

  const floor=progress.currentFloor;
  // Keep every combat floor populated from the first full-tower shot.
  // Future-floor guards are visual previews only: they stay idle and cannot
  // move, aim, fire or damage the player until that floor becomes current.
  for(let f=1;f<=FLOOR_COUNT;f++){
    const enemies=enemySets.get(f)??[];
    for(const e of enemies){
      if(e.hp<=0)continue;
      if(f===floor)art.enemy(e,time);
      else art.enemy({...e,vx:0,windup:0,shotFlash:0,hit:0},time);
    }
  }
  for(const s of enemyShots){
    const cx=s.x+s.w/2,cy=s.y+s.h/2;
    art.enemyBullet(cx,cy,Math.atan2(s.vy,s.vx));
  }
  for(const b of bullets){
    const cx=b.x+b.w/2,cy=b.y+b.h/2;
    art.heroBullet(cx,cy,Math.atan2(b.vy||0,b.vx));
  }
  if(player&&(player.invulnerable===0||Math.floor(time*14)%2===0))art.hero(player,time);
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life/p.max);
    art.ellipse(p.x,p.y,3,3,p.color,null);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,W,H);drawBackdrop();drawWorld();
  const strength=introActive ? .18 : .32;
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.12,W/2,H/2,Math.max(W,H)*.62);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${strength})`);
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}
function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=STEP){tick(STEP);accumulator-=STEP;}}else time+=dt;draw();requestAnimationFrame(frame);}

async function mountMatchingPuzzle(){
  const session=++puzzleSession;
  const body=$('puzzle-body');
  $('puzzle-title').textContent='مطابقة التوصيلات';
  $('puzzle-help').textContent='اختر موصلًا من اليسار ثم وصّله بالموصل المطابق له في الجهة الأخرى.';
  body.replaceChildren();

  const mount=document.createElement('div');
  mount.className='puzzle-root embedded-puzzle-root';
  body.append(mount);

  try{
    const puzzle=await createMatchingPuzzle({
      root:mount,
      audio:!muted,
      // Stage 2 keeps its own background score. Only Matching Puzzle SFX play here.
      audioOptions:{musicVolume:0,sfxVolume:.20}
    });
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[progress.currentFloor].puzzle!=='match'){
      puzzle.destroy();
      return;
    }
    activePuzzleModule=puzzle;
    puzzle.onSolved(()=>{
      if(session!==puzzleSession||!puzzleOpen)return;
      // Leave the solved board visible briefly so the green completion lights are seen.
      setTimeout(()=>{
        if(session!==puzzleSession||!puzzleOpen)return;
        closePuzzle();
        finishChallenge();
      },1000);
    });
    puzzle.start();
  }catch(error){
    console.error('Failed to mount reusable Matching Puzzle',error);
    if(session!==puzzleSession)return;
    body.innerHTML='<div class="embedded-puzzle-error">تعذر تحميل لوحة مطابقة التوصيلات.</div>';
  }
}
async function mountWiringPuzzle(){
  const session=++puzzleSession;
  const body=$('puzzle-body');
  $('puzzle-title').textContent='دائرة الطاقة';
  $('puzzle-help').textContent='دوّر قطع المواسير حتى يكتمل المسار من START إلى END.';
  body.replaceChildren();

  const mount=document.createElement('div');
  mount.className='puzzle-root embedded-puzzle-root';
  body.append(mount);

  try{
    const puzzle=await createWiringPuzzle({
      root:mount,
      audio:!muted,
      // Keep Stage 2 music playing. Disable only the puzzle's own ambient bed;
      // rotation and success SFX remain active.
      audioOptions:{musicVolume:0,sfxVolume:.20}
    });
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[progress.currentFloor].puzzle!=='wiring'){
      puzzle.destroy();
      return;
    }
    activePuzzleModule=puzzle;
    puzzle.onSolved(()=>{
      if(session!==puzzleSession||!puzzleOpen)return;
      setTimeout(()=>{
        if(session!==puzzleSession||!puzzleOpen)return;
        closePuzzle();
        finishChallenge();
      },1000);
    });
    puzzle.start();
  }catch(error){
    console.error('Failed to mount reusable Wiring Puzzle',error);
    if(session!==puzzleSession)return;
    body.innerHTML='<div class="embedded-puzzle-error">تعذر تحميل لوحة دائرة الطاقة.</div>';
  }
}
async function mountCubesPuzzle(){
  const session=++puzzleSession;
  const body=$('puzzle-body');
  $('puzzle-title').textContent='مسار التحكم';
  $('puzzle-help').textContent='اختر قطعتين لتبديل موقعيهما، ثم رتّب المسار الصحيح من START إلى GOAL.';
  body.replaceChildren();

  const mount=document.createElement('div');
  mount.className='puzzle-root embedded-puzzle-root';
  body.append(mount);

  try{
    const puzzle=await createCubesPuzzle({
      root:mount,
      audio:!muted,
      // Keep Chapter 2 music playing; use only Cubes Puzzle interaction/success SFX.
      audioOptions:{musicVolume:0,sfxVolume:.20}
    });
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[progress.currentFloor].puzzle!=='cubes'){
      puzzle.destroy();
      return;
    }
    activePuzzleModule=puzzle;
    puzzle.onSolved(()=>{
      if(session!==puzzleSession||!puzzleOpen)return;
      // Keep the solved board visible briefly before completing the final floor.
      setTimeout(()=>{
        if(session!==puzzleSession||!puzzleOpen)return;
        closePuzzle();
        finishChallenge();
      },1000);
    });
    puzzle.start();
  }catch(error){
    console.error('Failed to mount reusable Cubes Puzzle',error);
    if(session!==puzzleSession)return;
    body.innerHTML='<div class="embedded-puzzle-error">تعذر تحميل لوحة مسار التحكم.</div>';
  }
}
function openPuzzle(){
  const def=FLOOR_DEFS[progress.currentFloor];if(def.type!=='puzzle'||progress.floors[progress.currentFloor].complete)return;
  destroyActivePuzzle();
  puzzleOpen=true;clearInput();$('puzzle').hidden=false;$('action').hidden=true;$('puzzle-status').textContent='SYSTEM OFFLINE';
  $('puzzle').dataset.type=def.puzzle;
  if(def.puzzle==='match')mountMatchingPuzzle();else if(def.puzzle==='wiring')mountWiringPuzzle();else if(def.puzzle==='cubes')mountCubesPuzzle();
}
function closePuzzle(){
  puzzleOpen=false;destroyActivePuzzle();$('puzzle').hidden=true;clearInput();
  updateAction();
}
function doAction(){
  if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  const puzzleSpot=currentPuzzleInteraction();
  if(!done&&def.type==='puzzle'&&puzzleSpot&&near(puzzleSpot.x,puzzleSpot.range))openPuzzle();

}

const mapped=new Set(['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyK','KeyJ','Space','KeyL','ShiftLeft','ShiftRight']);
window.addEventListener('keydown',e=>{if(mapped.has(e.code)){if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;e.preventDefault();if(state==='playing'&&!puzzleOpen&&progress.mode==='floor')keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();doAction();}if(e.code==='Escape'&&!e.repeat){if(puzzleOpen)closePuzzle();else pause();}});
window.addEventListener('keyup',e=>keys.delete(e.code));
for(const button of buttons){
  button.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='playing'||puzzleOpen||progress.mode==='elevator')return;unlockAudio();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.action);button.classList.add('held');});
  const release=e=>{touch.delete(e.pointerId);if(![...touch.values()].includes(button.dataset.action))button.classList.remove('held');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
$('action').addEventListener('click',doAction);$('puzzle-close').addEventListener('click',closePuzzle);
$('play').addEventListener('click',()=>{if(state==='paused'){pause();return;}play();setIntroCopy();});
$('pause').addEventListener('click',pause);
$('sound').addEventListener('click',()=>{muted=!muted;unlockAudio();musicCtl?.setMuted(muted);$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)sound(660,.12);});
// iOS/Safari can emit transient window blur events while the player is dragging
// touch controls. Clear held input, but do not pause gameplay unless the document
// actually becomes hidden (handled by visibilitychange below).
window.addEventListener('blur',()=>{clearInput();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(state==='playing'&&!puzzleOpen)pause();}});
reset();setIntroCopy();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__stage2={get progress(){return progress;},get player(){return player;},get enemies(){return enemySets.get(progress.currentFloor)??[];},get state(){return state;},get elevatorAuto(){return elevatorAuto;},tick,play,reset,finishChallenge,openPuzzle};
