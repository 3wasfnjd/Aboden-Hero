import {clamp,overlaps,createPlayer,stepPlayer} from './world.js?v=20260916-action-1';
import {SHOT_INTERVAL,makeHeroBullet,bulletTargetBounds} from './hero-weapon.js?v=20260917-muzzle-1';
import {stepCombat} from './combat.js?v=20260917-straight-1';
import {createArt} from './art.js?v=20260917-cleanup-2';
import {createMusic} from './music.js?v=20260917-music-1';
import {
  FLOOR_DEFS,FLOOR_COUNT,createProgress,completeFloor,beginElevator,updateElevator,
  MATCH_SYMBOLS,isMatchSolved,WIRING_TEMPLATE,WIRING_INITIAL,isWiringSolved,
  CUBE_INITIAL,isCubeSolved
} from './stage2-state.js?v=20260919-stage2-2';

const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d'),art=createArt(ctx);
const W=720,H=1280,STEP=1/120,ZOOM=1.34;
const VIEW_W=W/ZOOM,VIEW_H=H/ZOOM;

const FLOOR_W=960,FLOOR_H=320,FLOOR_PITCH=320,GROUND_OFFSET=274;
const TOWER_X=960,TOWER_W=640,WORLD_W=TOWER_X+TOWER_W,WORLD_H=FLOOR_PITCH*FLOOR_COUNT;
const SHAFT_X=1112,SHAFT_W=220,CABIN_X=1136,CABIN_W=172,CABIN_H=218,ELEVATOR_ENTRY_X=1120;
const ELEVATOR_DURATION=3.05;
const PUZZLE_X={2:455,4:365,6:430};
const floorY=f=>(FLOOR_COUNT-f)*FLOOR_PITCH;
const groundY=f=>floorY(f)+GROUND_OFFSET;
const floorSourceY=(img,f)=>(f-1)*(img.naturalHeight/FLOOR_COUNT);
const floorSourceH=img=>img.naturalHeight/FLOOR_COUNT;
const cameraFloorY=f=>clamp(groundY(f)-VIEW_H*.67,0,WORLD_H-VIEW_H);
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

const keys=new Set(),touch=new Map(),buttons=[...document.querySelectorAll('[data-action]')];
let progress=createProgress(),player=createPlayer(105,groundY(1)-44),state='menu',time=0,elapsed=0;
let cameraX=0,cameraY=cameraFloorY(1),bullets=[],enemyShots=[],particles=[],enemySets=new Map();
let kills=0,deaths=0,toastTime=0,accumulator=0,last=0,elevatorTime=0,puzzleOpen=false;
let muted=false,audio=null,musicCtl=null;
let matchConnections={},matchSelected=null,wiringRotations=[...WIRING_INITIAL],cubeOrder=[...CUBE_INITIAL],cubeSelected=null;

function loadImage(url){const img=new Image();img.decoding='async';img.src=url;return img;}
const floorAtlas=loadImage('./assets/stage2/floors-atlas.webp?v=20260919-hi2');
const elevatorImage=loadImage('./assets/stage2/elevator.webp?v=20260919-hi2');

const solids=Array.from({length:FLOOR_COUNT},(_,i)=>({
  x:30,y:groundY(i+1),w:ELEVATOR_ENTRY_X+80,h:90,ground:true
}));

function makeEnemy(kind,x,floor,index){
  const g=groundY(floor),span=kind==='sniper'?135:105;
  return {x,y:g-32,w:34,h:32,min:Math.max(125,x-span),max:Math.min(825,x+span),vx:index%2?48:-48,hp:3,hit:0,fire:.9+index*.25,windup:0,aimX:0,aimY:0,kind,shotFlash:0};
}
function spawnFloorEnemies(floor){
  const def=FLOOR_DEFS[floor];
  if(def.type!=='combat'){enemySets.set(floor,[]);return;}
  const positions=def.enemies.length===2?[350,680]:[250,500,740];
  enemySets.set(floor,def.enemies.map((kind,i)=>makeEnemy(kind,positions[i],floor,i)));
}
function resetEnemies(){for(let f=1;f<=FLOOR_COUNT;f++)spawnFloorEnemies(f);}

function clearInput(){keys.clear();touch.clear();buttons.forEach(b=>b.classList.remove('held'));if(player){player.jumpHeld=false;player.dashHeld=false;player.buffer=0;}}
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
function burst(x,y,color='#6de0ff',count=8){for(let i=0;i<count;i++){const a=i*Math.PI*2/count;particles.push({x,y,vx:Math.cos(a)*(30+i*5),vy:Math.sin(a)*55-25,life:.45,max:.45,color});}}

function challengeLabel(){
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(done)return floor===FLOOR_COUNT?'النظام يعمل — اكتمل الفصل':'المصعد جاهز';
  if(def.type==='combat')return 'اقضِ على جميع الحراس';
  return def.puzzle==='match'?'صل الرموز المتطابقة':def.puzzle==='wiring'?'أكمل دائرة الطاقة':'رتّب المكعبات';
}
function updateHUD(){
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor];
  $('floor-label').textContent=`الطابق ${floor} / ${FLOOR_COUNT}`;$('floor-title').textContent=def.title;
  $('health').textContent='♥'.repeat(player.hp)+'♡'.repeat(5-player.hp);$('challenge').textContent=challengeLabel();
  $('hud').hidden=state!=='playing';
}
function near(x,range=90){return Math.abs((player.x+player.w/2)-x)<=range;}
function currentPuzzleX(){return PUZZLE_X[progress.currentFloor]??430;}
function updateAction(){
  const btn=$('action');btn.hidden=true;btn.classList.remove('ready-elevator');
  if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(!done&&def.type==='puzzle'&&near(currentPuzzleX(),105)){btn.textContent='فتح لوحة النظام';btn.hidden=false;return;}
  if(done&&floor<FLOOR_COUNT&&near(ELEVATOR_ENTRY_X,105)){btn.textContent='دخول المصعد ↑';btn.classList.add('ready-elevator');btn.hidden=false;}
}

function reset(){
  progress=createProgress();player=createPlayer(105,groundY(1)-44);player.facing=1;state='menu';time=0;elapsed=0;
  cameraX=0;cameraY=cameraFloorY(1);bullets=[];enemyShots=[];particles=[];kills=0;deaths=0;elevatorTime=0;puzzleOpen=false;
  matchConnections={};matchSelected=null;wiringRotations=[...WIRING_INITIAL];cubeOrder=[...CUBE_INITIAL];cubeSelected=null;
  resetEnemies();clearInput();updateHUD();updateAction();
}
function setIntroCopy(){
  $('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02';
  $('overlay').querySelector('.eyebrow').textContent='ROOFTOP ELEVATOR';
  $('overlay').querySelector('h1').innerHTML='اصعد المبنى.<br><em>طابقًا بعد طابق.</em>';
  $('overlay-description').textContent='ستة طوابق مركبة فوق بعضها ومصعد واحد يربطها. أنهِ تحدي كل طابق لتشغيل المصعد.';
  $('play').textContent='ابدأ الفصل الثاني ◀';
}
function play(){unlockAudio();if(state==='menu'||state==='won')reset();state='playing';$('overlay').hidden=true;$('controls').hidden=false;$('pause').textContent='Ⅱ';clearInput();last=performance.now();accumulator=0;updateHUD();updateAction();}
function pause(){
  if(state==='playing'){state='paused';clearInput();$('overlay').hidden=false;$('overlay').querySelector('.chapter-tag').textContent='MISSION PAUSED';$('overlay').querySelector('.eyebrow').textContent='CHAPTER 02';$('overlay').querySelector('h1').innerHTML='المهمة<br><em>متوقفة.</em>';$('overlay-description').textContent='أكمل من نفس الطابق عندما تكون جاهزًا.';$('play').textContent='متابعة ◀';$('controls').hidden=true;$('hud').hidden=true;$('action').hidden=true;$('pause').textContent='▶';}
  else if(state==='paused'){state='playing';$('overlay').hidden=true;$('controls').hidden=false;$('pause').textContent='Ⅱ';last=performance.now();accumulator=0;updateHUD();}
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
  deaths++;const floor=progress.currentFloor;player=createPlayer(floor===1?105:1040,groundY(floor)-44);player.facing=floor===1?1:-1;player.invulnerable=1.8;
  bullets=[];enemyShots=[];if(FLOOR_DEFS[floor].type==='combat'&&!progress.floors[floor].complete)spawnFloorEnemies(floor);
  toast('عدت إلى بداية الطابق');sound(170,.2,'triangle');updateHUD();
}
function hurt(){if(player.invulnerable>0||player.dashTime>0)return;player.hp--;player.invulnerable=1.25;burst(player.x+15,player.y+22,'#ff646d',10);sound(150,.16,'sawtooth',.04);if(player.hp<=0)respawn();else updateHUD();}
function finishChallenge(){
  const floor=progress.currentFloor;if(!completeFloor(progress,floor))return;
  enemyShots=[];bullets=[];burst(ELEVATOR_ENTRY_X,groundY(floor)-78,'#61ffa7',24);sound(920,.26,'triangle',.055);
  if(floor===FLOOR_COUNT){toast('غرفة التحكم تعمل — اكتمل الفصل');setTimeout(()=>{if(state==='playing'&&progress.currentFloor===FLOOR_COUNT)win();},1150);}
  else toast(`اكتمل الطابق ${floor} — أضيء المصعد بالأخضر`);
  updateHUD();updateAction();
}
function useElevator(){
  if(!beginElevator(progress))return;
  elevatorTime=0;enemyShots=[];bullets=[];clearInput();$('action').hidden=true;
  player.x=ELEVATOR_ENTRY_X+12;player.vx=0;player.vy=0;
  toast(`المصعد إلى الطابق ${progress.elevator.to}`);sound(210,.4,'sawtooth',.035);
}
function arriveNextFloor(){
  const floor=progress.currentFloor;player=createPlayer(1040,groundY(floor)-44);player.facing=-1;player.invulnerable=.9;enemyShots=[];bullets=[];
  cameraX=clamp(1020-VIEW_W*.48,0,WORLD_W-VIEW_W);cameraY=cameraFloorY(floor);
  toast(`الطابق ${floor} — ${FLOOR_DEFS[floor].title}`);sound(740,.18,'triangle');updateHUD();updateAction();
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

function tickElevator(dt){
  elevatorTime+=dt;
  const raw=clamp((elevatorTime-.42)/(ELEVATOR_DURATION-.84),0,1),move=ease(raw);
  updateElevator(progress,move);
  const e=progress.elevator;
  if(e){
    const cabGround=lerp(groundY(e.from),groundY(e.to),move);
    cameraX=clamp(CABIN_X+CABIN_W/2-VIEW_W*.5,0,WORLD_W-VIEW_W);
    cameraY=clamp(cabGround-VIEW_H*.56,0,WORLD_H-VIEW_H);
  }else arriveNextFloor();
}

function tick(dt){
  if(state!=='playing'||puzzleOpen)return;
  time+=dt;elapsed+=dt;
  if(progress.mode==='elevator'){tickElevator(dt);updateHUD();return;}
  const controls=input(),{jumped,landed}=stepPlayer(player,controls,solids,dt);
  player.x=clamp(player.x,40,ELEVATOR_ENTRY_X+45-player.w);
  if(jumped){burst(player.x+15,player.y+44,'#d9d2b2',5);sound(500,.1,'triangle');}if(landed)burst(player.x+15,player.y+44,'#d9d2b2',4);
  if(player.y>groundY(progress.currentFloor)+145){respawn();return;}
  if(controls.shoot&&player.shot<=0){player.shot=SHOT_INTERVAL;bullets.push(makeHeroBullet(art.heroMuzzle(player,time),player.facing));sound(660,.055,'triangle',.035);}
  if(FLOOR_DEFS[progress.currentFloor].type==='combat'&&!progress.floors[progress.currentFloor].complete)tickCombat(dt);
  else{for(const b of bullets){b.x+=b.vx*dt;b.life-=dt;}bullets=bullets.filter(b=>b.life>0);enemyShots=[];}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
  const tx=clamp(player.x-VIEW_W*.43,0,WORLD_W-VIEW_W),ty=cameraFloorY(progress.currentFloor);
  cameraX+=(tx-cameraX)*(1-Math.exp(-7*dt));cameraY+=(ty-cameraY)*(1-Math.exp(-7*dt));
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  updateHUD();updateAction();
}

function drawBackdrop(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#07101c');g.addColorStop(.5,'#0a1726');g.addColorStop(1,'#02060a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.6;
  ctx.fillStyle='#0c1a2a';for(let x=-50;x<W+80;x+=62){const h=130+(x*17%260+260)%260;ctx.fillRect(x,H-h,46,h);}
  ctx.fillStyle='#cf2432';for(let x=18;x<W;x+=71)for(let y=H-315;y<H-70;y+=57)ctx.fillRect(x,y,2,7);
  ctx.fillStyle='#cbd9e5';for(let i=0;i<38;i++)ctx.fillRect((i*131+35)%W,(i*71+22)%510,1.3,1.3);
  ctx.restore();
}
function drawFloorStatus(f,fy){
  const st=progress.floors[f];if(!st.complete)return;
  const x=760,y=fy+63,w=166,h=190;
  ctx.save();ctx.fillStyle='rgba(3,16,13,.90)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#55ff9e';ctx.lineWidth=2.5;ctx.strokeRect(x+2,y+2,w-4,h-4);
  ctx.shadowColor='#55ff9e';ctx.shadowBlur=24;ctx.fillStyle='#70ffae';ctx.textAlign='center';ctx.font='900 104px system-ui';ctx.fillText(String(f),x+w/2,y+122);
  ctx.shadowBlur=0;ctx.fillStyle='#b8ffd6';ctx.font='800 13px system-ui';ctx.fillText('FLOOR CLEARED',x+w/2,y+158);
  ctx.fillStyle='#5dffa1';ctx.beginPath();ctx.arc(x+w-18,y+18,7,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawPuzzleMarker(f,fy){
  if(FLOOR_DEFS[f].type!=='puzzle'||!progress.floors[f].unlocked||progress.floors[f].complete)return;
  const x=PUZZLE_X[f],y=groundY(f)-92,pulse=.72+Math.sin(time*4)*.22;
  ctx.save();ctx.globalAlpha=f===progress.currentFloor?1:.35;ctx.strokeStyle=`rgba(80,210,255,${pulse})`;ctx.fillStyle='rgba(4,22,34,.84)';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(x-48,y-28,96,56,7);ctx.fill();ctx.stroke();ctx.fillStyle='#6ce0ff';ctx.textAlign='center';ctx.font='900 11px system-ui';ctx.fillText('SYSTEM',x,y-3);ctx.font='800 9px system-ui';ctx.fillStyle='#bcefff';ctx.fillText('INTERACT',x,y+14);ctx.restore();
}
function drawBridge(f){
  const gy=groundY(f),complete=progress.floors[f].complete;
  ctx.save();ctx.fillStyle='#151b22';ctx.fillRect(900,gy-6,228,14);ctx.fillStyle='#303b47';for(let x=910;x<1120;x+=36)ctx.fillRect(x,gy-5,22,3);
  ctx.strokeStyle='#87683c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(922,gy-16);ctx.lineTo(1115,gy-16);ctx.stroke();
  ctx.strokeStyle=complete?'#61ffa7':'#ff3d49';ctx.shadowColor=complete?'#61ffa7':'#ff3d49';ctx.shadowBlur=14;ctx.fillStyle=complete?'#61ffa7':'#ff3d49';ctx.fillRect(1063,gy-74,8,20);ctx.shadowBlur=0;ctx.restore();
}
function drawTower(){
  if(elevatorImage.complete&&elevatorImage.naturalWidth)ctx.drawImage(elevatorImage,TOWER_X,0,TOWER_W,WORLD_H);
  else{ctx.fillStyle='#10171e';ctx.fillRect(TOWER_X,0,TOWER_W,WORLD_H);}
  const grad=ctx.createLinearGradient(SHAFT_X,0,SHAFT_X+SHAFT_W,0);grad.addColorStop(0,'rgba(3,7,10,.68)');grad.addColorStop(.5,'rgba(1,4,7,.94)');grad.addColorStop(1,'rgba(3,7,10,.68)');
  ctx.fillStyle=grad;ctx.fillRect(SHAFT_X,22,SHAFT_W,WORLD_H-44);
  ctx.strokeStyle='#29343f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(SHAFT_X+24,30);ctx.lineTo(SHAFT_X+24,WORLD_H-30);ctx.moveTo(SHAFT_X+SHAFT_W-24,30);ctx.lineTo(SHAFT_X+SHAFT_W-24,WORLD_H-30);ctx.stroke();
  for(let f=1;f<=FLOOR_COUNT;f++)drawBridge(f);
}
function cabinGround(){
  if(progress.mode==='elevator'&&progress.elevator){
    const raw=clamp((elevatorTime-.42)/(ELEVATOR_DURATION-.84),0,1);
    return lerp(groundY(progress.elevator.from),groundY(progress.elevator.to),ease(raw));
  }
  return groundY(progress.currentFloor);
}
function drawCabin(){
  const gy=cabinGround(),y=gy-CABIN_H+5;
  ctx.save();ctx.shadowColor=progress.elevatorReady?'#5dffa1':'#ec3945';ctx.shadowBlur=progress.elevatorReady?25:10;
  if(elevatorImage.complete&&elevatorImage.naturalWidth){
    const iw=elevatorImage.naturalWidth,ih=elevatorImage.naturalHeight;
    ctx.drawImage(elevatorImage,iw*.285,ih*.812,iw*.43,ih*.168,CABIN_X,y,CABIN_W,CABIN_H);
  }else{ctx.fillStyle='#171e25';ctx.fillRect(CABIN_X,y,CABIN_W,CABIN_H);}
  ctx.shadowBlur=0;
  const open=progress.mode==='floor'&&progress.elevatorReady&&progress.currentFloor<FLOOR_COUNT;
  if(open){
    ctx.fillStyle='rgba(1,4,6,.9)';ctx.fillRect(CABIN_X+43,y+48,CABIN_W-86,CABIN_H-63);
    ctx.strokeStyle='#61ffa7';ctx.lineWidth=2;ctx.strokeRect(CABIN_X+40,y+44,CABIN_W-80,CABIN_H-58);
  }
  const green=progress.mode==='floor'&&progress.floors[progress.currentFloor].complete;
  ctx.fillStyle=green?'#61ffa7':'#ff3f4b';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.fillRect(CABIN_X+12,y+26,6,26);ctx.fillRect(CABIN_X+CABIN_W-18,y+26,6,26);ctx.restore();
}
function drawWorld(){
  ctx.save();ctx.scale(ZOOM,ZOOM);ctx.translate(-cameraX,-cameraY);
  drawTower();
  for(let f=1;f<=FLOOR_COUNT;f++){
    const fy=floorY(f),st=progress.floors[f];
    ctx.save();ctx.globalAlpha=st.unlocked?(f===progress.currentFloor?1:.64):.24;
    if(floorAtlas.complete&&floorAtlas.naturalWidth){
      ctx.drawImage(floorAtlas,0,floorSourceY(floorAtlas,f),floorAtlas.naturalWidth,floorSourceH(floorAtlas),0,fy,FLOOR_W,FLOOR_H);
    }else{ctx.fillStyle='#101923';ctx.fillRect(0,fy,FLOOR_W,FLOOR_H);}
    ctx.restore();drawFloorStatus(f,fy);drawPuzzleMarker(f,fy);
  }
  drawCabin();
  const floor=progress.currentFloor,enemies=enemySets.get(floor)??[];
  for(const e of enemies)if(e.hp>0)art.enemy(e,time);
  for(const s of enemyShots){const cx=s.x+s.w/2,cy=s.y+s.h/2;art.enemyBullet(cx,cy,Math.atan2(s.vy,s.vx));}
  for(const b of bullets){const cx=b.x+b.w/2,cy=b.y+b.h/2;art.heroBullet(cx,cy,Math.atan2(b.vy||0,b.vx));}
  if(progress.mode==='floor'&&(player.invulnerable===0||Math.floor(time*14)%2===0))art.hero(player,time);
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);art.ellipse(p.x,p.y,3,3,p.color,null);}ctx.globalAlpha=1;
  ctx.restore();
}
function draw(){
  ctx.clearRect(0,0,W,H);drawBackdrop();drawWorld();
  const v=ctx.createRadialGradient(W/2,H/2,160,W/2,H/2,760);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}
function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=STEP){tick(STEP);accumulator-=STEP;}}else time+=dt;draw();requestAnimationFrame(frame);}

function puzzleSolved(type){return type==='match'?isMatchSolved(matchConnections):type==='wiring'?isWiringSolved(wiringRotations):isCubeSolved(cubeOrder);}
function solveCurrentPuzzle(){
  const type=FLOOR_DEFS[progress.currentFloor].puzzle;if(!puzzleSolved(type))return;
  $('puzzle-status').textContent='SYSTEM ONLINE';$('puzzle-status').classList.add('online');sound(960,.25,'triangle',.06);
  setTimeout(()=>{closePuzzle();finishChallenge();},600);
}
function symbolLabel(s){return s==='hex'?'⬡':s==='bolt'?'ϟ':'▲';}
function renderMatch(){
  $('puzzle-title').textContent='توصيل الطاقة';$('puzzle-help').textContent='اختر رمزًا من اليسار ثم صله بالرمز المطابق في اليمين. يجب تشغيل المسارات الثلاثة.';
  const shuffled=['tri','hex','bolt'];
  $('puzzle-body').innerHTML=`<div class="match-board"><div class="match-col">${MATCH_SYMBOLS.map(s=>`<button class="match-node ${s}" data-left="${s}">${symbolLabel(s)}</button>`).join('')}</div><div class="match-lines">${MATCH_SYMBOLS.map(s=>`<i class="${matchConnections[s]===s?'on':''}"></i>`).join('')}</div><div class="match-col">${shuffled.map(s=>`<button class="match-node ${s}" data-right="${s}">${symbolLabel(s)}</button>`).join('')}</div></div>`;
  $('puzzle-body').querySelectorAll('[data-left]').forEach(b=>b.addEventListener('click',()=>{matchSelected=b.dataset.left;renderMatch();$('puzzle-body').querySelector(`[data-left="${matchSelected}"]`)?.classList.add('selected');}));
  $('puzzle-body').querySelectorAll('[data-right]').forEach(b=>b.addEventListener('click',()=>{if(!matchSelected)return;matchConnections[matchSelected]=b.dataset.right;matchSelected=null;renderMatch();solveCurrentPuzzle();}));
}
function wireGlyph(type){return type==='straight'?'━':type==='elbow'?'┗':type==='tee'?'┳':type==='cross'?'╋':'•';}
function renderWiring(){
  $('puzzle-title').textContent='دائرة الطاقة';$('puzzle-help').textContent='اضغط قطع الأسلاك لتدويرها. كوّن دائرة مستمرة من START إلى END.';
  $('puzzle-body').innerHTML=`<div class="wire-grid">${WIRING_TEMPLATE.map((tile,i)=>`<button class="wire-tile" data-wire="${i}"><span style="transform:rotate(${(wiringRotations[i]??0)*90}deg)">${wireGlyph(tile.type)}</span></button>`).join('')}</div>`;
  $('puzzle-body').querySelectorAll('[data-wire]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.wire);wiringRotations[i]=(wiringRotations[i]+1)%4;renderWiring();solveCurrentPuzzle();}));
}
const CUBE_META={start:['ϟ','START','start'],right:['→','',''],down:['↓','',''],lock:['×','LOCK','lock'],junction:['╋','','junction'],down2:['↓','',''],straight:['┃','',''],right2:['→','',''],goal:['◯','GOAL','goal']};
function renderCubes(){
  $('puzzle-title').textContent='ترتيب المكعبات';$('puzzle-help').textContent='اختر مكعبين لتبديل موقعيهما. رتّب المسار من START حتى GOAL. المكعب LOCK ثابت.';
  $('puzzle-body').innerHTML=`<div class="cube-grid">${cubeOrder.map((id,i)=>{const [icon,label,cls]=CUBE_META[id];return `<button class="cube-tile ${cls} ${cubeSelected===i?'selected':''}" data-cube="${i}" ${id==='lock'?'disabled':''}><span><strong>${icon}</strong>${label}</span></button>`;}).join('')}</div>`;
  $('puzzle-body').querySelectorAll('[data-cube]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.cube);if(cubeOrder[i]==='lock')return;if(cubeSelected===null){cubeSelected=i;renderCubes();return;}if(cubeSelected===i){cubeSelected=null;renderCubes();return;}[cubeOrder[cubeSelected],cubeOrder[i]]=[cubeOrder[i],cubeOrder[cubeSelected]];cubeSelected=null;renderCubes();solveCurrentPuzzle();}));
}
function openPuzzle(){
  const def=FLOOR_DEFS[progress.currentFloor];if(def.type!=='puzzle'||progress.floors[progress.currentFloor].complete)return;
  puzzleOpen=true;clearInput();$('puzzle').hidden=false;$('action').hidden=true;$('puzzle-status').textContent='SYSTEM OFFLINE';$('puzzle-status').classList.remove('online');
  $('puzzle').dataset.type=def.puzzle;
  if(def.puzzle==='match')renderMatch();else if(def.puzzle==='wiring')renderWiring();else renderCubes();
}
function closePuzzle(){puzzleOpen=false;$('puzzle').hidden=true;clearInput();updateAction();}
function doAction(){
  if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(!done&&def.type==='puzzle'&&near(currentPuzzleX(),105))openPuzzle();
  else if(done&&floor<FLOOR_COUNT&&near(ELEVATOR_ENTRY_X,105))useElevator();
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
window.addEventListener('blur',()=>{clearInput();if(state==='playing'&&!puzzleOpen)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(state==='playing'&&!puzzleOpen)pause();}});
reset();setIntroCopy();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__stage2={get progress(){return progress;},get player(){return player;},get enemies(){return enemySets.get(progress.currentFloor)??[];},get state(){return state;},tick,play,reset,finishChallenge,useElevator,openPuzzle};
