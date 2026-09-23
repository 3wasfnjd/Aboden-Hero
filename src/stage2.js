import {lockSafariZoom} from './gesture-lock.js?v=20260921-safari-lock-1';
import {clamp,overlaps,createPlayer,stepPlayer} from './world.js?v=20260916-action-1';
import {SHOT_INTERVAL,makeHeroBullet,bulletTargetBounds} from './hero-weapon.js?v=20260921-stage2-new-enemies-1';
import {hitsShieldFromFront} from './enemy-weapon.js?v=20260922-hq-sprites-1';
import {stepCombat} from './combat.js?v=20260921-stage2-new-enemies-1';
import {createArt} from './art.js?v=20260922-final-scale-1';
import {createMusic} from './music.js?v=20260917-music-1';
import {createMatchingPuzzle} from '../puzzle-kit/matching/matching.js?v=20260920-stage2-embed-1';
import {createWiringPuzzle} from '../puzzle-kit/wiring/wiring.js?v=20260919-stage2-embed-2';
import {createCubesPuzzle} from '../puzzle-kit/cubes/cubes.js?v=20260920-stage2-embed-1';
import {
  FLOOR_DEFS,FLOOR_COUNT,createProgress,completeFloor,reachFloor
} from './stage2-state.js?v=20260923-always-on-elevators-1';
import {
  loadCheckpointFloor,saveCheckpointFloor,clearCheckpointFloor,restoreProgressFromCheckpoint
} from './stage2-save.js?v=20260923-stage2-save-elevator-link-1';
import {
  TOWER_WIDTH,TOWER_HEIGHT,FLOOR_LEFT,FLOOR_RIGHT,
  ELEVATOR_WIDTH,ELEVATOR_PLATFORM_HEIGHT,
  groundY,makeFloorPlatforms,elevatorGround,puzzleInteraction,
  elevatorXForFloor,floorLabelX,floorLabelY,arrivalXForFloor
} from './stage2-tower.js?v=20260923-always-on-elevators-1';
import {
  ROOFTOP_LADDER_X,createRooftopBattle,drawRooftopLadder,drawRooftopClimber
} from './stage2-rooftop.js?v=20260922-alpha-normalized-1';

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
let activePuzzleModule=null,puzzleSession=0,activePuzzleFloor=null;
let muted=false,audio=null,musicCtl=null;
let scene='tower',rooftopUnlocked=false,climbTime=0,climbStartX=0,climbStartY=0,endingTime=0;


function loadImage(url){const img=new Image();img.decoding='async';if(url)img.src=url;return img;}
const towerBackground=loadImage('./assets/stage2/tower-background-with-puzzles.png?v=20260921-embedded-puzzles-1');
const elevatorPlatformImage=loadImage('./assets/ui/level/platform.png?v=20260921-stage2-elevator-1');
const checkpointImage=loadImage('./assets/ui/level/checkpoint.png?v=20260923-stage2-floor-checkpoints-1');
const CHAPTER_PRELOAD=Object.freeze([
  './assets/stage2/tower-background-with-puzzles.png?v=20260921-embedded-puzzles-1',
  './assets/stage2/rooftop/28C8741E-FF4D-4642-9B2D-F77236FFA97F.png',
  './assets/ui/level/platform.png?v=20260921-stage2-elevator-1',
  './assets/ui/level/checkpoint.png?v=20260923-stage2-floor-checkpoints-1',
  './assets/ui/hud/health.png',
  './assets/ui/hud/area.png',
  './puzzle-kit/cubes/assets/original/board.png'
]);
let chapterAssetsReady=false,chapterLoadStarted=false;
function updateChapterLoader(done,total){
  const percent=total?Math.round(done/total*100):100;
  const fill=$('loader-fill'),label=$('loader-label'),value=$('loader-percent');
  if(fill)fill.style.width=`${percent}%`;
  if(value)value.textContent=`${percent}%`;
  if(label)label.textContent=percent>=100?'اكتمل تحميل صور المرحلة':'جاري تحميل صور المرحلة…';
}
function preloadChapterAssets(){
  if(chapterLoadStarted)return;
  chapterLoadStarted=true;
  let done=0;
  const total=CHAPTER_PRELOAD.length;
  updateChapterLoader(0,total);
  Promise.allSettled(CHAPTER_PRELOAD.map(src=>new Promise(resolve=>{
    const image=new Image();
    image.decoding='async';
    let settled=false;
    const finish=()=>{
      if(settled)return;
      settled=true;
      done++;
      updateChapterLoader(done,total);
      resolve();
    };
    image.onload=finish;image.onerror=finish;image.src=src;
    if(image.complete)queueMicrotask(finish);
  }))).then(()=>{
    chapterAssetsReady=true;
    updateChapterLoader(total,total);
    setIntroCopy();
  });
}
const CHECKPOINT_DISPLAY_H=100;
const CHECKPOINT_LEFT_X=360;
const CHECKPOINT_RIGHT_X=664;
const rooftop=createRooftopBattle(ctx,{width:W,height:H});

const floorPlatforms=makeFloorPlatforms();
function createElevators(){
  return Array.from({length:FLOOR_COUNT-1},(_,index)=>{
    const from=index+1;
    return {
      from,to:from+1,
      x:elevatorXForFloor(from),
      y:groundY(from),
      w:ELEVATOR_WIDTH,h:ELEVATOR_PLATFORM_HEIGHT,
      ground:true,oneWay:true,phase:0
    };
  });
}
const elevators=createElevators();
const solids=[...floorPlatforms,...elevators];

function createFloorCheckpoints(){
  return Array.from({length:FLOOR_COUNT},(_,index)=>{
    const floor=index+1;
    return {floor,x:floor%2===1?CHECKPOINT_LEFT_X:CHECKPOINT_RIGHT_X,active:false};
  });
}
let checkpoints=createFloorCheckpoints();

function checkpointForFloor(floor){
  return checkpoints[floor-1]??null;
}
function activateCheckpoint(floor){
  const cp=checkpointForFloor(floor);
  if(!cp||cp.active)return false;
  cp.active=true;
  saveCheckpointFloor(floor,FLOOR_COUNT);
  player.hp=5;
  burst(cp.x,groundY(floor)-48,'#61ffa7',12);
  toast(`تم حفظ التقدم — الطابق ${floor}`);
  sound(920,.2,'triangle');
  updateHUD();
  return true;
}
function updateCheckpointActivation(){
  if(scene!=='tower'||progress.mode!=='floor'||!player.grounded)return;
  const floor=playerFloor();
  if(floor!==progress.currentFloor)return;
  const cp=checkpointForFloor(floor);
  if(!cp||cp.active)return;
  const center=player.x+player.w/2;
  if(Math.abs(center-cp.x)<=42)activateCheckpoint(floor);
}
function drawCheckpoint(cp){
  if(!checkpointImage.complete||!checkpointImage.naturalWidth)return;
  const dh=CHECKPOINT_DISPLAY_H;
  const dw=dh*(checkpointImage.naturalWidth/checkpointImage.naturalHeight);
  ctx.save();
  if(!cp.active){
    ctx.filter='grayscale(.85) brightness(.65)';
    ctx.globalAlpha=.85;
  }else{
    ctx.globalAlpha=.92+Math.sin(time*3+cp.x+cp.floor)*.08;
  }
  ctx.drawImage(checkpointImage,cp.x-dw/2,groundY(cp.floor)-dh,dw,dh);
  ctx.restore();
}

function elevatorForFloor(floor){
  return floor>=1&&floor<FLOOR_COUNT?elevators[floor-1]??null:null;
}
function elevatorCenterForFloor(floor){
  const elevator=elevatorForFloor(floor);
  return elevator?elevator.x+ELEVATOR_WIDTH/2:ROOFTOP_LADDER_X;
}
function playerOnElevator(elevator,y=elevator.y){
  const feet=player.y+player.h;
  return player.x+player.w>elevator.x+6
    && player.x<elevator.x+elevator.w-6
    && Math.abs(feet-y)<=12
    && player.vy>=-40;
}
function syncPlayerFloor(){
  if(scene!=='tower'||!player.grounded)return;
  const floor=playerFloor(),feet=player.y+player.h;
  if(Math.abs(feet-groundY(floor))>16)return;
  if(floor!==progress.currentFloor)reachFloor(progress,floor);
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
  const g=groundY(floor),isDrone=kind==='drone';
  const span=kind==='sniper'?120:isDrone?135:95;
  const y=isDrone?g-82:g-32;
  return {
    x,y,w:isDrone?48:34,h:isDrone?46:32,
    min:Math.max(FLOOR_LEFT+35,x-span),
    max:Math.min(FLOOR_RIGHT-35,x+span),
    vx:index%2?48:-48,hp:isDrone?2:3,hit:0,fire:.9+index*.25,
    windup:0,aimX:0,aimY:0,kind,shotFlash:0,shieldFlash:0,
    hoverY:y,hoverPhase:index*1.37+floor*.61
  };
}
function enemyPositions(count){
  if(count===2)return [340,625];
  if(count===3)return [270,470,670];
  if(count===4)return [235,390,560,720];
  if(count===5)return [215,345,480,615,750];
  const gap=(FLOOR_RIGHT-FLOOR_LEFT-140)/Math.max(1,count-1);
  return Array.from({length:count},(_,i)=>FLOOR_LEFT+70+i*gap);
}
function spawnFloorEnemies(floor){
  const def=FLOOR_DEFS[floor];
  if(def.type!=='combat'){enemySets.set(floor,[]);return;}
  const positions=enemyPositions(def.enemies.length);
  enemySets.set(floor,def.enemies.map((kind,i)=>makeEnemy(kind,positions[i],floor,i)));
}
function resetEnemies(){for(let f=1;f<=FLOOR_COUNT;f++)spawnFloorEnemies(f);}
function playerFloor(){
  const feet=player.y+player.h;
  let closest=1,distance=Infinity;
  for(let floor=1;floor<=FLOOR_COUNT;floor++){
    const next=Math.abs(feet-groundY(floor));
    if(next<distance){closest=floor;distance=next;}
  }
  return closest;
}
function tickEnemyPatrol(dt){
  for(let floor=1;floor<=FLOOR_COUNT;floor++){
    for(const e of enemySets.get(floor)??[]){
      if(e.hp<=0)continue;
      const locked=e.windup>0||e.shotFlash>0||e.hit>0||(e.shieldFlash??0)>0;
      if(!locked)e.x+=e.vx*dt;
      if(e.kind==='drone')e.y=e.hoverY+Math.sin(time*2.8+e.hoverPhase)*5;
      e.hit=Math.max(0,e.hit-dt);
      e.shieldFlash=Math.max(0,(e.shieldFlash??0)-dt);
      if(e.x<e.min){e.x=e.min;e.vx=Math.abs(e.vx);}
      if(e.x+e.w>e.max){e.x=e.max-e.w;e.vx=-Math.abs(e.vx);}
    }
  }
}

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

function isRooftopScene(){
  return scene.startsWith('rooftop')||scene==='ending';
}
function challengeLabel(){
  if(scene==='rooftop-fight')return 'اهزم حارس السطح';
  if(scene==='rooftop-victory')return 'سقط الزعيم';
  if(scene==='rooftop-dance')return 'رقصة النصر — FLOSS';
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(done)return floor===FLOOR_COUNT?'ممر السطح مفتوح':'اكتمل تحدي الطابق — تابع الصعود';
  if(def.type==='combat')return 'اقضِ على جميع الأعداء';
  return def.puzzle==='match'?'صل الرموز المتطابقة':def.puzzle==='wiring'?'أكمل دائرة الطاقة':'رتّب المكعبات';
}
function syncControls(){
  const scripted=introActive||scene==='climbing'||scene==='rooftop-intro'||scene==='rooftop-victory'||scene==='rooftop-dance'||scene==='ending'||rooftop.mode==='hero-ko';
  $('controls').hidden=state!=='playing'||puzzleOpen||scripted;
  document.body.classList.toggle('rooftop-melee',scene==='rooftop-fight'&&rooftop.mode==='fight'&&state==='playing');
}
function updateHUD(){
  const bossHud=$('boss-hud');
  if(isRooftopScene()){
    const stats=rooftop.stats();
    $('area-name').textContent='السطح — المواجهة الأخيرة';
    $('area-progress').style.width='100%';
    $('health').textContent='♥'.repeat(Math.max(0,stats.heroHp))+'♡'.repeat(Math.max(0,stats.heroMax-stats.heroHp));
    $('health-panel')?.setAttribute('data-hp',String(Math.max(0,stats.heroHp)));
    $('challenge').textContent=challengeLabel();
    $('boss-health-fill').style.width=`${clamp(stats.bossHp/stats.bossMax*100,0,100)}%`;
    bossHud.hidden=state!=='playing'||!(scene==='rooftop-fight'||scene==='rooftop-victory');
    $('hud').hidden=state!=='playing'||scene==='rooftop-intro'||scene==='rooftop-dance'||scene==='ending';
    syncControls();
    return;
  }
  bossHud.hidden=true;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor];
  $('area-name').textContent=`الطابق ${floor} — ${def.title}`;
  $('area-progress').style.width=`${clamp(floor/FLOOR_COUNT*100,0,100)}%`;
  $('health').textContent='♥'.repeat(player.hp)+'♡'.repeat(5-player.hp);
  $('health-panel')?.setAttribute('data-hp',String(Math.max(0,player.hp)));
  $('challenge').textContent=challengeLabel();
  $('hud').hidden=state!=='playing'||introActive||scene==='climbing';
  syncControls();
}
function near(x,range=90){return Math.abs((player.x+player.w/2)-x)<=range;}
function currentPuzzleInteraction(){
  const floor=playerFloor();
  const spot=puzzleInteraction(floor);
  return spot?{floor,spot}:null;
}
function updateAction(){
  const btn=$('action');btn.hidden=true;
  if(state!=='playing'||puzzleOpen)return;
  if(scene!=='tower'||progress.mode!=='floor')return;
  if(rooftopUnlocked&&progress.currentFloor===FLOOR_COUNT&&playerFloor()===FLOOR_COUNT&&near(ROOFTOP_LADDER_X,100)){
    btn.textContent='الصعود إلى السطح';btn.hidden=false;return;
  }
  const interaction=currentPuzzleInteraction();
  if(!interaction)return;
  const {floor,spot}=interaction,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(!done&&def.type==='puzzle'&&near(spot.x,spot.range)){
    btn.textContent='فتح اللغز';btn.hidden=false;return;
  }
}
function reset(){
  progress=createProgress();checkpoints=createFloorCheckpoints();
  const savedFloor=restoreProgressFromCheckpoint(progress,loadCheckpointFloor(FLOOR_COUNT),FLOOR_COUNT);
  const spawnFloor=savedFloor||1;
  if(savedFloor)for(const cp of checkpoints)cp.active=cp.floor<=savedFloor;
  const savedCheckpoint=savedFloor?checkpointForFloor(savedFloor):null;
  const spawnX=savedCheckpoint?savedCheckpoint.x-15:arrivalXForFloor(1,30);
  player=createPlayer(spawnX,groundY(spawnFloor)-44);
  player.facing=spawnFloor%2===1?1:-1;state='menu';time=0;elapsed=0;
  destroyActivePuzzle();bullets=[];enemyShots=[];particles=[];kills=0;puzzleOpen=false;activePuzzleFloor=null;
  for(const elevator of elevators){elevator.phase=0;elevator.x=elevatorXForFloor(elevator.from);elevator.y=groundY(elevator.from);}
  scene='tower';rooftopUnlocked=false;climbTime=0;climbStartX=0;climbStartY=0;endingTime=0;
  rooftop.reset();document.body.classList.remove('rooftop-melee');
  introTime=0;introActive=false;cameraZoom=FIT_ZOOM;
  const full=fullTowerCamera();cameraX=full.x;cameraY=full.y;
  $('puzzle').hidden=true;$('boss-hud').hidden=true;
  resetEnemies();
  if(savedFloor){
    for(let floor=1;floor<savedFloor;floor++){
      if(FLOOR_DEFS[floor].type==='combat')enemySets.set(floor,[]);
    }
  }
  clearInput();updateHUD();updateAction();
}
function setIntroCopy(){
  const overlay=$('overlay'),playButton=$('play'),loader=$('asset-loader');
  overlay.dataset.mode='menu';
  overlay.querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02';
  overlay.querySelector('.eyebrow').textContent='الفصل الثاني';
  overlay.querySelector('h1').innerHTML='<em>البرج</em>';
  $('overlay-description').textContent='اختبارات أعلى، أعداء أشد، والطريق إلى السطح مفتوح لمن يصل.';
  if(loader)loader.hidden=false;
  const savedFloor=loadCheckpointFloor(FLOOR_COUNT);
  playButton.disabled=!chapterAssetsReady;
  playButton.textContent=chapterAssetsReady
    ?(savedFloor?`متابعة من نقطة حفظ الطابق ${savedFloor} ◀`:'ابدأ المهمة ◀')
    :'جاري تحميل صور المرحلة…';
}
function play(){
  unlockAudio();
  if(state==='menu'||state==='won')reset();
  state='playing';introActive=true;introTime=0;cameraZoom=FIT_ZOOM;
  const full=fullTowerCamera();cameraX=full.x;cameraY=full.y;
  $('overlay').hidden=true;$('pause').textContent='Ⅱ';
  clearInput();last=performance.now();accumulator=0;updateHUD();updateAction();
}
function pause(){
  if(state==='playing'){
    state='paused';clearInput();$('overlay').hidden=false;$('overlay').dataset.mode='pause';$('asset-loader').hidden=true;$('play').disabled=false;
    $('overlay').querySelector('.chapter-tag').textContent='MISSION PAUSED';
    $('overlay').querySelector('.eyebrow').textContent='CHAPTER 02';
    $('overlay').querySelector('h1').innerHTML='المهمة<br><em>متوقفة.</em>';
    $('overlay-description').textContent='أكمل من نفس النقطة عندما تكون جاهزًا.';
    $('play').textContent='متابعة ◀';$('hud').hidden=true;$('boss-hud').hidden=true;$('action').hidden=true;$('pause').textContent='▶';syncControls();
  }else if(state==='paused'){
    state='playing';$('overlay').hidden=true;$('pause').textContent='Ⅱ';last=performance.now();accumulator=0;updateHUD();updateAction();
  }
}
function win(){
  clearCheckpointFloor();
  state='won';clearInput();document.body.classList.remove('rooftop-melee');
  $('overlay').hidden=false;$('overlay').dataset.mode='win';$('asset-loader').hidden=true;$('play').disabled=false;$('controls').hidden=true;$('hud').hidden=true;$('boss-hud').hidden=true;$('action').hidden=true;
  $('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02 COMPLETE';
  $('overlay').querySelector('.eyebrow').textContent='VICTORY DANCE COMPLETE';
  $('overlay').querySelector('h1').innerHTML='انتصار.<br><em>عبودين!</em>';
  $('overlay-description').textContent=`هزمت حارس السطح وختمت الفصل برقصة Floss. أسقطت ${kills} أعداء قبل المواجهة الأخيرة. زمن المهمة ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}.`;
  $('play').textContent='إعادة الفصل الثاني ↻';sound(1080,.45,'triangle',.06);
}
function respawn(){
  const floor=progress.currentFloor;
  const cp=checkpointForFloor(floor);
  const spawnX=cp?.active?cp.x-15:arrivalXForFloor(floor,30);
  player=createPlayer(spawnX,groundY(floor)-44);
  player.facing=floor%2===1?1:-1;player.invulnerable=1.8;
  bullets=[];enemyShots=[];if(FLOOR_DEFS[floor].type==='combat'&&!progress.floors[floor].complete)spawnFloorEnemies(floor);
  toast(cp?.active?'عدت إلى آخر نقطة حفظ':'عدت إلى بداية الطابق');sound(170,.2,'triangle');updateHUD();
}
function hurt(){if(player.invulnerable>0||player.dashTime>0)return;player.hp--;player.invulnerable=1.25;burst(player.x+15,player.y+22,'#ff646d',10);sound(150,.16,'sawtooth',.04);if(player.hp<=0)respawn();else updateHUD();}
function finishChallenge(floor=progress.currentFloor){
  if(!completeFloor(progress,floor))return;
  enemyShots=[];bullets=[];sound(920,.26,'triangle',.055);
  if(floor===FLOOR_COUNT){
    rooftopUnlocked=true;
    burst(ROOFTOP_LADDER_X,groundY(floor)-72,'#61ffa7',24);
    toast('تم فتح ممر السطح');
  }else{
    burst(elevatorCenterForFloor(floor),groundY(floor)-36,'#61ffa7',24);
  }
  updateHUD();updateAction();
}
function startClimb(){
  if(scene!=='tower'||!rooftopUnlocked||progress.currentFloor!==FLOOR_COUNT)return;
  scene='climbing';climbTime=0;climbStartX=player.x;climbStartY=player.y;
  player.vx=0;player.vy=0;player.grounded=true;clearInput();sound(540,.16,'triangle');updateHUD();updateAction();
}
function enterRooftop(){
  scene='rooftop-intro';enemyShots=[];bullets=[];clearInput();
  rooftop.start(player.hp);sound(190,.28,'sawtooth',.035);updateHUD();updateAction();
}
function tickRooftop(dt){
  elapsed+=dt;
  if(scene==='ending'){
    endingTime+=dt;
    if(endingTime>=1.35){win();return;}
    updateHUD();return;
  }
  const events=rooftop.tick(dt,input());
  for(const ev of events){
    if(ev==='fight-start'){scene='rooftop-fight';toast('قتال بالأيدي فقط');sound(310,.2,'sawtooth',.04);}
    else if(ev==='hero-hit')sound(145,.13,'sawtooth',.04);
    else if(ev==='boss-hit')sound(235,.10,'triangle',.045);
    else if(ev==='boss-block')sound(105,.08,'square',.035);
    else if(ev==='hero-dodge')sound(520,.07,'triangle',.025);
    else if(ev==='hero-defeated')toast('المواجهة لم تنتهِ');
    else if(ev==='fight-restart'){scene='rooftop-fight';toast('واجهه من جديد');}
    else if(ev==='boss-defeated'){scene='rooftop-victory';sound(920,.32,'triangle',.06);}
    else if(ev==='dance-start'){scene='rooftop-dance';clearInput();toast('رقصة النصر — FLOSS!');sound(1120,.22,'triangle',.055);}
    else if(ev==='dance-finished'){win();return;}
  }
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  updateHUD();updateAction();
}

function tickCombat(dt){
  const floor=playerFloor();
  const enemies=FLOOR_DEFS[floor].type==='combat'?(enemySets.get(floor)??[]):[];
  for(const e of enemies)if(e.hp>0&&overlaps(player,e))hurt();

  const dummyBoss={x:0,y:0,w:0,h:0,hp:0,maxHP:0,active:false,hit:0,fire:99,windup:0,aimX:0,aimY:0};
  for(const ev of stepCombat({enemies,boss:dummyBoss},player,enemyShots,dt,(e,isBoss)=>art.enemyMuzzle(e,time,isBoss)))if(ev==='hit')hurt();
  enemyShots=enemyShots.filter(s=>s.life>0);

  const allEnemies=[...enemySets.values()].flat();
  for(const b of bullets){
    b.x+=b.vx*dt;b.life-=dt;if(b.life<=0)continue;
    for(const e of allEnemies)if(e.hp>0&&overlaps(b,bulletTargetBounds(e))){
      b.life=0;
      if(hitsShieldFromFront(e,b.vx)){
        e.shieldFlash=.18;
        burst(b.x+b.w/2,b.y+b.h/2,'#9ed8ff',8);
        sound(980,.06,'square',.026);
        break;
      }
      e.hp--;e.hit=.12;burst(b.x,b.y,'#e6c878',5);
      if(e.hp<=0){e.deathAt=time;kills++;burst(e.x+17,e.y+16,'#ef874f',14);sound(260,.12,'triangle');}
      break;
    }
  }
  bullets=bullets.filter(b=>b.life>0);

  for(let f=1;f<=FLOOR_COUNT;f++){
    const def=FLOOR_DEFS[f],set=enemySets.get(f)??[];
    if(def.type==='combat'&&!progress.floors[f].complete&&set.length&&set.every(e=>e.hp<=0))finishChallenge(f);
  }
}
function tickElevators(dt){
  for(const elevator of elevators){
    const previousY=elevator.y;
    const rider=playerOnElevator(elevator,previousY);
    elevator.phase=(elevator.phase+dt/ELEVATOR_DURATION)%2;
    const ascending=elevator.phase<=1;
    const move=ascending?ease(elevator.phase):ease(2-elevator.phase);
    elevator.x=elevatorXForFloor(elevator.from);
    elevator.y=elevatorGround(elevator.from,elevator.to,move);
    const dy=elevator.y-previousY;
    if(rider){
      player.y+=dy;
      player.grounded=true;
      if(player.vy>0)player.vy=0;
    }
  }
}

function tick(dt){
  if(state!=='playing'||puzzleOpen)return;
  time+=dt;

  if(scene==='climbing'){
    elapsed+=dt;climbTime+=dt;
    const align=ease(clamp(climbTime/.30,0,1));
    const rise=ease(clamp((climbTime-.20)/2.35,0,1));
    player.x=lerp(climbStartX,ROOFTOP_LADDER_X-player.w/2,align);
    player.y=lerp(climbStartY,42,rise);
    if(climbTime>=2.65){enterRooftop();return;}
    updateHUD();updateAction();return;
  }
  if(isRooftopScene()){tickRooftop(dt);return;}

  tickEnemyPatrol(dt);
  tickElevators(dt);

  if(introActive){
    introTime+=dt;
    const normalized=clamp(introTime/INTRO_DURATION,0,1);
    setIntroCamera(normalized);
    if(normalized>=1){
      introActive=false;
      cameraZoom=GAME_ZOOM;
      const target=followTarget(GAME_ZOOM);
      cameraX=target.x;cameraY=target.y;
      updateHUD();updateAction();
    }
    return;
  }

  elapsed+=dt;
  const controls=input(),{jumped,landed}=stepPlayer(player,controls,solids,dt);
  syncPlayerFloor();
  player.x=clamp(player.x,FLOOR_LEFT,FLOOR_RIGHT-player.w);
  if(jumped){burst(player.x+15,player.y+44,'#d9d2b2',5);sound(500,.1,'triangle');}if(landed)burst(player.x+15,player.y+44,'#d9d2b2',4);
  if(player.y>groundY(progress.currentFloor)+150){respawn();return;}
  updateCheckpointActivation();
  if(controls.shoot&&player.shot<=0){player.shot=SHOT_INTERVAL;bullets.push(makeHeroBullet(art.heroMuzzle(player,time),player.facing));sound(660,.055,'triangle',.035);}
  tickCombat(dt);
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

function drawElevatorPlatform(elevator){
  const gy=elevator.y,color='#61ffa7';
  ctx.save();
  ctx.shadowColor=color;ctx.shadowBlur=20;
  if(elevatorPlatformImage.complete&&elevatorPlatformImage.naturalWidth){
    const dw=ELEVATOR_WIDTH;
    const dh=elevatorPlatformImage.naturalHeight*(dw/elevatorPlatformImage.naturalWidth);
    ctx.drawImage(elevatorPlatformImage,elevator.x,gy-14,dw,dh);
  }else{
    ctx.fillStyle='rgba(14,22,31,.92)';
    ctx.fillRect(elevator.x,gy-10,ELEVATOR_WIDTH,14);
  }
  ctx.globalAlpha=.88;ctx.fillStyle=color;
  ctx.fillRect(elevator.x+12,gy-4,ELEVATOR_WIDTH-24,3);
  ctx.restore();
}

const DEBUG_PLATFORMS=new URLSearchParams(location.search).has('platforms');
function drawCollisionDebug(){
  if(!DEBUG_PLATFORMS)return;
  ctx.save();ctx.globalAlpha=.45;ctx.fillStyle='#00ff9d';
  for(const solid of floorPlatforms)ctx.fillRect(solid.x,solid.y-2,solid.w,4);
  ctx.fillStyle='#00d9ff';for(const elevator of elevators)ctx.fillRect(elevator.x,elevator.y-3,elevator.w,6);
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
  for(const cp of checkpoints)drawCheckpoint(cp);
  for(const elevator of elevators)drawElevatorPlatform(elevator);
  drawRooftopLadder(ctx,{x:ROOFTOP_LADDER_X,bottomY:groundY(FLOOR_COUNT),unlocked:rooftopUnlocked,time});
  drawCollisionDebug();

  for(let f=1;f<=FLOOR_COUNT;f++){
    const enemies=enemySets.get(f)??[];
    for(const e of enemies)if(e.hp>0||(e.deathAt!=null&&time-e.deathAt<.90))art.enemy(e,time);
  }
  for(const s of enemyShots){
    const cx=s.x+s.w/2,cy=s.y+s.h/2;
    art.enemyBullet(cx,cy,Math.atan2(s.vy,s.vx));
  }
  for(const b of bullets){
    const cx=b.x+b.w/2,cy=b.y+b.h/2;
    art.heroBullet(cx,cy,Math.atan2(b.vy||0,b.vx));
  }
  if(player&&(player.invulnerable===0||Math.floor(time*14)%2===0)){
    if(scene==='climbing')drawRooftopClimber(ctx,{x:player.x+player.w/2,feetY:player.y+player.h,time:climbTime,facing:1});
    else art.hero(player,time);
  }
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life/p.max);
    art.ellipse(p.x,p.y,3,3,p.color,null);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}
function draw(){
  ctx.clearRect(0,0,W,H);
  if(isRooftopScene()){
    rooftop.draw(time);
    const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.16,W/2,H/2,Math.max(W,H)*.68);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.38)');
    ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
    if(scene==='ending'){
      ctx.fillStyle=`rgba(0,0,0,${clamp(endingTime/1.35,0,1)})`;ctx.fillRect(0,0,W,H);
    }
    return;
  }
  drawBackdrop();drawWorld();
  const strength=introActive ? .18 : .32;
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.12,W/2,H/2,Math.max(W,H)*.62);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${strength})`);
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}
function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=STEP){tick(STEP);accumulator-=STEP;}}else time+=dt;draw();requestAnimationFrame(frame);}

async function mountMatchingPuzzle(){
  const session=++puzzleSession;
  const floor=activePuzzleFloor;
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
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[floor]?.puzzle!=='match'){
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
        finishChallenge(floor);
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
  const floor=activePuzzleFloor;
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
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[floor]?.puzzle!=='wiring'){
      puzzle.destroy();
      return;
    }
    activePuzzleModule=puzzle;
    puzzle.onSolved(()=>{
      if(session!==puzzleSession||!puzzleOpen)return;
      setTimeout(()=>{
        if(session!==puzzleSession||!puzzleOpen)return;
        closePuzzle();
        finishChallenge(floor);
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
  const floor=activePuzzleFloor;
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
    if(session!==puzzleSession||!puzzleOpen||FLOOR_DEFS[floor]?.puzzle!=='cubes'){
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
        finishChallenge(floor);
      },1000);
    });
    puzzle.start();
  }catch(error){
    console.error('Failed to mount reusable Cubes Puzzle',error);
    if(session!==puzzleSession)return;
    body.innerHTML='<div class="embedded-puzzle-error">تعذر تحميل لوحة مسار التحكم.</div>';
  }
}
function openPuzzle(floor=playerFloor()){
  const def=FLOOR_DEFS[floor];if(def.type!=='puzzle'||progress.floors[floor].complete)return;
  destroyActivePuzzle();
  activePuzzleFloor=floor;
  puzzleOpen=true;clearInput();$('puzzle').hidden=false;$('action').hidden=true;$('puzzle-status').textContent='SYSTEM OFFLINE';
  $('puzzle').dataset.type=def.puzzle;
  if(def.puzzle==='match')mountMatchingPuzzle();else if(def.puzzle==='wiring')mountWiringPuzzle();else if(def.puzzle==='cubes')mountCubesPuzzle();
}
function closePuzzle(){
  puzzleOpen=false;activePuzzleFloor=null;destroyActivePuzzle();$('puzzle').hidden=true;clearInput();
  updateAction();
}
function doAction(){
  if(state!=='playing'||puzzleOpen)return;
  if(scene!=='tower'||progress.mode!=='floor')return;
  if(scene!=='tower'||progress.mode!=='floor')return;
  if(rooftopUnlocked&&progress.currentFloor===FLOOR_COUNT&&playerFloor()===FLOOR_COUNT&&near(ROOFTOP_LADDER_X,100)){
    startClimb();return;
  }
  const interaction=currentPuzzleInteraction();
  if(!interaction)return;
  const {floor,spot}=interaction,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(!done&&def.type==='puzzle'&&near(spot.x,spot.range))openPuzzle(floor);
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
reset();setIntroCopy();preloadChapterAssets();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__stage2={get progress(){return progress;},get player(){return player;},get enemies(){return enemySets.get(progress.currentFloor)??[];},get checkpoints(){return checkpoints;},get elevators(){return elevators;},get state(){return state;},get scene(){return scene;},get rooftop(){return rooftop.stats();},tick,play,reset,finishChallenge,openPuzzle,startClimb};
