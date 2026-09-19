import {clamp,overlaps,createPlayer,stepPlayer} from './world.js?v=20260916-action-1';
import {SHOT_INTERVAL,makeHeroBullet,bulletTargetBounds} from './hero-weapon.js?v=20260917-muzzle-1';
import {stepCombat} from './combat.js?v=20260917-straight-1';
import {createArt} from './art.js?v=20260917-cleanup-2';
import {createMusic} from './music.js?v=20260917-music-1';
import {
  FLOOR_DEFS,FLOOR_COUNT,createProgress,completeFloor,beginElevator,updateElevator,
  MATCH_SYMBOLS,isMatchSolved,WIRING_TEMPLATE,WIRING_INITIAL,isWiringSolved,
  CUBE_INITIAL,isCubeSolved
} from './stage2-state.js?v=20260919-stage2-1';

const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d'),art=createArt(ctx);
const W=720,H=1280,STEP=1/120;
const FLOOR_W=960,FLOOR_H=320,FLOOR_GAP=360,TOP_PAD=650,GROUND_OFFSET=270;
const WORLD_H=3100,PLAYER_MIN_X=48,PLAYER_MAX_X=912,ELEVATOR_X=842,PUZZLE_X=470;
const ELEVATOR_DURATION=2.35;
const floorY=f=>TOP_PAD+(FLOOR_COUNT-f)*FLOOR_GAP;
const groundY=f=>floorY(f)+GROUND_OFFSET;
const cameraTargetY=f=>clamp(groundY(f)-900,0,WORLD_H-H);
const lerp=(a,b,t)=>a+(b-a)*t;

const keys=new Set(),touch=new Map(),buttons=[...document.querySelectorAll('[data-action]')];
let progress=createProgress(),player=createPlayer(92,groundY(1)-44),state='menu',time=0,elapsed=0;
let cameraX=0,cameraY=cameraTargetY(1),bullets=[],enemyShots=[],particles=[],enemySets=new Map();
let kills=0,deaths=0,toastTime=0,accumulator=0,last=0,elevatorTime=0,puzzleOpen=false;
let muted=false,audio=null,musicCtl=null;
let matchConnections={},matchSelected=null,wiringRotations=[...WIRING_INITIAL],cubeOrder=[...CUBE_INITIAL],cubeSelected=null;

function loadImage(url){const img=new Image();img.decoding='async';img.src=url;return img;}
const floorImages=Array.from({length:FLOOR_COUNT+1},(_,i)=>i?loadImage(`./assets/stage2/floor-${i}.webp`):null);
const elevatorImage=loadImage('./assets/stage2/elevator-tower.webp');
const solids=Array.from({length:FLOOR_COUNT},(_,i)=>({x:0,y:groundY(i+1),w:FLOOR_W,h:110,ground:true}));

function makeEnemy(kind,x,floor,index){
  const g=groundY(floor),span=kind==='sniper'?120:90;
  return {x,y:g-32,w:34,h:32,min:Math.max(120,x-span),max:Math.min(820,x+span),vx:index%2?48:-48,hp:3,hit:0,fire:.9+index*.25,windup:0,aimX:0,aimY:0,kind,shotFlash:0};
}
function spawnFloorEnemies(floor){
  const def=FLOOR_DEFS[floor];
  if(def.type!=='combat'){enemySets.set(floor,[]);return;}
  const positions=def.enemies.length===2?[390,680]:[260,510,735];
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
  const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.62),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
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
function updateAction(){
  const btn=$('action');btn.hidden=true;btn.classList.remove('ready-elevator');
  if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;
  const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;
  if(!done&&def.type==='puzzle'&&near(PUZZLE_X,115)){btn.textContent='حل اللغز';btn.hidden=false;return;}
  if(done&&floor<FLOOR_COUNT&&near(ELEVATOR_X,95)){btn.textContent='استخدم المصعد ↑';btn.classList.add('ready-elevator');btn.hidden=false;}
}

function reset(){
  progress=createProgress();player=createPlayer(92,groundY(1)-44);player.facing=1;state='menu';time=0;elapsed=0;cameraX=0;cameraY=cameraTargetY(1);bullets=[];enemyShots=[];particles=[];kills=0;deaths=0;elevatorTime=0;puzzleOpen=false;matchConnections={};matchSelected=null;wiringRotations=[...WIRING_INITIAL];cubeOrder=[...CUBE_INITIAL];cubeSelected=null;resetEnemies();clearInput();updateHUD();updateAction();
}
function play(){unlockAudio();if(state==='menu'||state==='won')reset();state='playing';$('overlay').hidden=true;$('controls').hidden=false;$('pause').textContent='Ⅱ';clearInput();last=performance.now();accumulator=0;updateHUD();updateAction();}
function pause(){
  if(state==='playing'){state='paused';clearInput();$('overlay').hidden=false;$('overlay').querySelector('.chapter-tag').textContent='MISSION PAUSED';$('overlay').querySelector('.eyebrow').textContent='CHAPTER 02';$('overlay').querySelector('h1').innerHTML='المهمة<br><em>متوقفة.</em>';$('overlay-description').textContent='أكمل من نفس الطابق عندما تكون جاهزًا.';$('play').textContent='متابعة ◀';$('controls').hidden=true;$('hud').hidden=true;$('action').hidden=true;$('pause').textContent='▶';}
  else if(state==='paused'){state='playing';$('overlay').hidden=true;$('controls').hidden=false;$('pause').textContent='Ⅱ';last=performance.now();accumulator=0;updateHUD();}
}
function win(){state='won';clearInput();$('overlay').hidden=false;$('controls').hidden=true;$('hud').hidden=true;$('action').hidden=true;$('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02 COMPLETE';$('overlay').querySelector('.eyebrow').textContent='CONTROL ROOM ONLINE';$('overlay').querySelector('h1').innerHTML='وصلت للأعلى.<br><em>النظام تحت سيطرتك.</em>';$('overlay-description').textContent=`أكملت الطوابق الستة وأسقطت ${kills} حراس. زمن المهمة ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}.`;$('play').textContent='إعادة الفصل الثاني ↻';sound(1080,.45,'triangle',.06);}

function respawn(){
  deaths++;const floor=progress.currentFloor;player=createPlayer(floor===1?92:790,groundY(floor)-44);player.facing=floor===1?1:-1;player.invulnerable=1.8;bullets=[];enemyShots=[];if(FLOOR_DEFS[floor].type==='combat'&&!progress.floors[floor].complete)spawnFloorEnemies(floor);toast('عدت إلى بداية الطابق');sound(170,.2,'triangle');updateHUD();
}
function hurt(){if(player.invulnerable>0||player.dashTime>0)return;player.hp--;player.invulnerable=1.25;burst(player.x+15,player.y+22,'#ff646d',10);sound(150,.16,'sawtooth',.04);if(player.hp<=0)respawn();else updateHUD();}
function finishChallenge(){
  const floor=progress.currentFloor;if(!completeFloor(progress,floor))return;
  enemyShots=[];bullets=[];burst(ELEVATOR_X,groundY(floor)-95,'#61ffa7',24);sound(920,.26,'triangle',.055);
  if(floor===FLOOR_COUNT){toast('النظام يعمل — تم فتح غرفة التحكم');setTimeout(()=>{if(state==='playing'&&progress.currentFloor===FLOOR_COUNT)win();},900);}
  else toast(`اكتمل الطابق ${floor} — المصعد جاهز`);
  updateHUD();updateAction();
}
function useElevator(){
  if(!beginElevator(progress))return;
  elevatorTime=0;enemyShots=[];bullets=[];clearInput();$('action').hidden=true;toast(`المصعد يصعد إلى الطابق ${progress.elevator.to}`);sound(230,.32,'sawtooth',.035);
}
function arriveNextFloor(){
  const floor=progress.currentFloor;player=createPlayer(805,groundY(floor)-44);player.facing=-1;player.invulnerable=.8;cameraX=clamp(player.x-360,0,FLOOR_W-W);enemyShots=[];bullets=[];toast(`الطابق ${floor} — ${FLOOR_DEFS[floor].title}`);sound(740,.18,'triangle');updateHUD();updateAction();
}

function tickCombat(dt){
  const floor=progress.currentFloor,enemies=enemySets.get(floor)??[];
  for(const e of enemies){if(e.hp<=0)continue;if(e.windup<=0)e.x+=e.vx*dt;e.hit=Math.max(0,e.hit-dt);if(e.x<e.min){e.x=e.min;e.vx=Math.abs(e.vx);}if(e.x+e.w>e.max){e.x=e.max-e.w;e.vx=-Math.abs(e.vx);}if(overlaps(player,e))hurt();}
  const dummyBoss={x:0,y:0,w:0,h:0,hp:0,maxHP:0,active:false,hit:0,fire:99,windup:0,aimX:0,aimY:0};
  for(const ev of stepCombat({enemies,boss:dummyBoss},player,enemyShots,dt,(e,isBoss)=>art.enemyMuzzle(e,time,isBoss))){if(ev==='hit')hurt();}
  enemyShots=enemyShots.filter(s=>s.life>0);
  for(const b of bullets){b.x+=b.vx*dt;b.life-=dt;if(b.life<=0)continue;for(const e of enemies){if(e.hp>0&&overlaps(b,bulletTargetBounds(e))){b.life=0;e.hp--;e.hit=.12;burst(b.x,b.y,'#e6c878',5);if(e.hp<=0){kills++;burst(e.x+17,e.y+16,'#ef874f',14);sound(260,.12,'triangle');}break;}}}
  bullets=bullets.filter(b=>b.life>0);
  if(!progress.floors[floor].complete&&enemies.length&&enemies.every(e=>e.hp<=0))finishChallenge();
}

function tick(dt){
  if(state!=='playing'||puzzleOpen)return;
  time+=dt;elapsed+=dt;
  if(progress.mode==='elevator'){
    elevatorTime+=dt;const t=clamp(elevatorTime/ELEVATOR_DURATION,0,1);updateElevator(progress,t);
    const e=progress.elevator;if(e){const fromG=groundY(e.from),toG=groundY(e.to);player.x=ELEVATOR_X;player.y=lerp(fromG-44,toG-44,t);cameraY=lerp(cameraTargetY(e.from),cameraTargetY(e.to),t);cameraX+=(clamp(ELEVATOR_X-470,0,FLOOR_W-W)-cameraX)*(1-Math.exp(-5*dt));}
    if(progress.mode==='floor')arriveNextFloor();
    updateHUD();return;
  }
  const controls=input(),{jumped,landed}=stepPlayer(player,controls,solids,dt);
  player.x=clamp(player.x,PLAYER_MIN_X,PLAYER_MAX_X-player.w);
  if(jumped){burst(player.x+15,player.y+44,'#d9d2b2',5);sound(500,.1,'triangle');}if(landed)burst(player.x+15,player.y+44,'#d9d2b2',4);
  if(player.y>groundY(progress.currentFloor)+150){respawn();return;}
  if(controls.shoot&&player.shot<=0){player.shot=SHOT_INTERVAL;bullets.push(makeHeroBullet(art.heroMuzzle(player,time),player.facing));sound(660,.055,'triangle',.035);}
  if(FLOOR_DEFS[progress.currentFloor].type==='combat'&&!progress.floors[progress.currentFloor].complete)tickCombat(dt);
  else{for(const b of bullets){b.x+=b.vx*dt;b.life-=dt;}bullets=bullets.filter(b=>b.life>0);enemyShots=[];}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
  const targetX=clamp(player.x-300,0,FLOOR_W-W);cameraX+=(targetX-cameraX)*(1-Math.exp(-7*dt));cameraY+=(cameraTargetY(progress.currentFloor)-cameraY)*(1-Math.exp(-6*dt));
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
  updateHUD();updateAction();
}

function drawBackdrop(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#07101c');g.addColorStop(.55,'#0b1828');g.addColorStop(1,'#03070c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.45;for(let i=0;i<55;i++){const x=(i*137+41)%W,y=(i*83+17)%720;ctx.fillStyle=i%7?'#8fb1ca':'#e6eef5';ctx.fillRect(x,y,1.4,1.4);}ctx.restore();
  ctx.fillStyle='#08111d';for(let x=-40;x<W+60;x+=78){const h=100+(x*13%190+190)%190;ctx.fillRect(x,H-h,58,h);ctx.fillStyle='#8d1d28';for(let y=H-h+28;y<H-20;y+=42)ctx.fillRect(x+20,y,3,7);ctx.fillStyle='#08111d';}
}
function drawFloorStatus(f,fy){
  const st=progress.floors[f],complete=st.complete,current=f===progress.currentFloor;
  const x=806,y=fy+70,w=120,h=172;
  if(complete){ctx.save();ctx.fillStyle='rgba(3,26,17,.88)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#54ff9a';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);ctx.shadowColor='#54ff9a';ctx.shadowBlur=18;ctx.fillStyle='#74ffb4';ctx.textAlign='center';ctx.font='900 86px system-ui';ctx.fillText(String(f),x+w/2,y+103);ctx.shadowBlur=0;ctx.beginPath();ctx.fillStyle='#5cff9d';ctx.arc(x+w-15,y+14,6,0,Math.PI*2);ctx.fill();ctx.restore();}
  else if(current){ctx.save();ctx.strokeStyle=`rgba(255,72,80,${.6+Math.sin(time*4)*.25})`;ctx.lineWidth=2;ctx.strokeRect(x+2,y+2,w-4,h-4);ctx.restore();}
}
function drawWorld(){
  ctx.save();ctx.translate(-cameraX,-cameraY);
  for(let f=1;f<=FLOOR_COUNT;f++){
    const fy=floorY(f),img=floorImages[f],st=progress.floors[f];ctx.save();ctx.globalAlpha=st.unlocked?(f===progress.currentFloor?1:.72):.28;ctx.drawImage(img,0,fy,FLOOR_W,FLOOR_H);ctx.restore();drawFloorStatus(f,fy);
    if(FLOOR_DEFS[f].type==='puzzle'&&st.unlocked&&!st.complete){const px=PUZZLE_X,py=fy+118;ctx.save();ctx.fillStyle='#07111edb';ctx.strokeStyle=f===progress.currentFloor?'#43c7ff':'#31495f';ctx.lineWidth=2;ctx.fillRect(px-58,py-42,116,84);ctx.strokeRect(px-58,py-42,116,84);ctx.fillStyle='#62d8ff';ctx.textAlign='center';ctx.font='900 13px system-ui';ctx.fillText('PUZZLE',px,py-5);ctx.font='700 10px system-ui';ctx.fillStyle='#b9d5e8';ctx.fillText('SYSTEM OFFLINE',px,py+16);ctx.restore();}
  }
  const floor=progress.currentFloor,enemies=enemySets.get(floor)??[];
  for(const e of enemies)if(e.hp>0)art.enemy(e,time);
  for(const s of enemyShots){const cx=s.x+s.w/2,cy=s.y+s.h/2,angle=Math.atan2(s.vy,s.vx);art.enemyBullet(cx,cy,angle);}
  for(const b of bullets){const cx=b.x+b.w/2,cy=b.y+b.h/2;art.heroBullet(cx,cy,Math.atan2(b.vy||0,b.vx));}
  if(player.invulnerable===0||Math.floor(time*14)%2===0)art.hero(player,time);
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);art.ellipse(p.x,p.y,3,3,p.color,null);}ctx.globalAlpha=1;ctx.restore();
}
function drawElevatorOverlay(){
  if(progress.mode!=='elevator')return;
  const e=progress.elevator,t=e?.progress??1;ctx.save();ctx.fillStyle='rgba(1,5,9,.58)';ctx.fillRect(0,0,W,H);ctx.globalAlpha=.96;const dh=1040,dw=dh/3;ctx.drawImage(elevatorImage,(W-dw)/2,105,dw,dh);ctx.globalAlpha=1;
  const x=W/2+dw*.34,y=1030-t*760;ctx.shadowColor='#6affad';ctx.shadowBlur=20;ctx.fillStyle='#6affad';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e8fff2';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText(`↑  ${e?e.from:progress.currentFloor} → ${e?e.to:progress.currentFloor}`,W/2,94);ctx.restore();
}
function draw(){ctx.clearRect(0,0,W,H);drawBackdrop();drawWorld();drawElevatorOverlay();const v=ctx.createRadialGradient(W/2,H/2,200,W/2,H/2,780);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.34)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=STEP){tick(STEP);accumulator-=STEP;}}else time+=dt;draw();requestAnimationFrame(frame);}

function puzzleSolved(type){return type==='match'?isMatchSolved(matchConnections):type==='wiring'?isWiringSolved(wiringRotations):isCubeSolved(cubeOrder);}
function solveCurrentPuzzle(){const type=FLOOR_DEFS[progress.currentFloor].puzzle;if(!puzzleSolved(type))return;$('puzzle-status').textContent='SYSTEM ONLINE';$('puzzle-status').classList.add('online');sound(960,.25,'triangle',.06);setTimeout(()=>{closePuzzle();finishChallenge();},550);}
function symbolLabel(s){return s==='hex'?'⬡':s==='bolt'?'ϟ':'▲';}
function renderMatch(){
  $('puzzle-title').textContent='توصيل الرموز';$('puzzle-help').textContent='اختر رمزًا من اليسار ثم صِلْه بالرمز المطابق في اليمين.';
  const shuffled=['tri','hex','bolt'];$('puzzle-body').innerHTML=`<div class="match-board"><div class="match-col">${MATCH_SYMBOLS.map(s=>`<button class="match-node ${s}" data-left="${s}">${symbolLabel(s)}</button>`).join('')}</div><div class="match-lines">${MATCH_SYMBOLS.map(s=>`<i data-line="${s}" class="${matchConnections[s]===s?'on':''}"></i>`).join('')}</div><div class="match-col">${shuffled.map(s=>`<button class="match-node ${s}" data-right="${s}">${symbolLabel(s)}</button>`).join('')}</div></div>`;
  $('puzzle-body').querySelectorAll('[data-left]').forEach(b=>b.addEventListener('click',()=>{matchSelected=b.dataset.left;renderMatch();$('puzzle-body').querySelector(`[data-left="${matchSelected}"]`)?.classList.add('selected');}));
  $('puzzle-body').querySelectorAll('[data-right]').forEach(b=>b.addEventListener('click',()=>{if(!matchSelected)return;matchConnections[matchSelected]=b.dataset.right;matchSelected=null;renderMatch();solveCurrentPuzzle();}));
}
function wireGlyph(type){return type==='straight'?'━':type==='elbow'?'┗':type==='tee'?'┳':type==='cross'?'╋':'•';}
function renderWiring(){
  $('puzzle-title').textContent='دائرة الطاقة';$('puzzle-help').textContent='اضغط قطع الأسلاك لتدويرها. أوصل الطاقة من المدخل الأحمر إلى المخرج الأزرق.';
  $('puzzle-body').innerHTML=`<div class="wire-grid">${WIRING_TEMPLATE.map((tile,i)=>`<button class="wire-tile" data-wire="${i}" aria-label="تدوير قطعة ${i+1}"><span style="transform:rotate(${(wiringRotations[i]??0)*90}deg)">${wireGlyph(tile.type)}</span></button>`).join('')}</div>`;
  $('puzzle-body').querySelectorAll('[data-wire]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.wire);wiringRotations[i]=(wiringRotations[i]+1)%4;renderWiring();solveCurrentPuzzle();}));
}
const CUBE_META={start:['ϟ','START','start'],right:['→','',''],down:['↓','',''],lock:['×','LOCK','lock'],junction:['╋','','junction'],down2:['↓','',''],straight:['┃','',''],right2:['→','',''],goal:['◯','GOAL','goal']};
function renderCubes(){
  $('puzzle-title').textContent='ترتيب المكعبات';$('puzzle-help').textContent='اختر مكعبين لتبديل موقعيهما. المكعب LOCK ثابت. كوّن الترتيب الصحيح من START إلى GOAL.';
  $('puzzle-body').innerHTML=`<div class="cube-grid">${cubeOrder.map((id,i)=>{const [icon,label,cls]=CUBE_META[id];return `<button class="cube-tile ${cls} ${cubeSelected===i?'selected':''}" data-cube="${i}" ${id==='lock'?'disabled':''}><span><strong>${icon}</strong>${label}</span></button>`;}).join('')}</div>`;
  $('puzzle-body').querySelectorAll('[data-cube]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.cube);if(cubeOrder[i]==='lock')return;if(cubeSelected===null){cubeSelected=i;renderCubes();return;}if(cubeSelected===i){cubeSelected=null;renderCubes();return;}[cubeOrder[cubeSelected],cubeOrder[i]]=[cubeOrder[i],cubeOrder[cubeSelected]];cubeSelected=null;renderCubes();solveCurrentPuzzle();}));
}
function openPuzzle(){const def=FLOOR_DEFS[progress.currentFloor];if(def.type!=='puzzle'||progress.floors[progress.currentFloor].complete)return;puzzleOpen=true;clearInput();$('puzzle').hidden=false;$('action').hidden=true;$('puzzle-status').textContent='SYSTEM OFFLINE';$('puzzle-status').classList.remove('online');if(def.puzzle==='match')renderMatch();else if(def.puzzle==='wiring')renderWiring();else renderCubes();}
function closePuzzle(){puzzleOpen=false;$('puzzle').hidden=true;clearInput();updateAction();}
function doAction(){if(state!=='playing'||progress.mode!=='floor'||puzzleOpen)return;const floor=progress.currentFloor,def=FLOOR_DEFS[floor],done=progress.floors[floor].complete;if(!done&&def.type==='puzzle'&&near(PUZZLE_X,115))openPuzzle();else if(done&&floor<FLOOR_COUNT&&near(ELEVATOR_X,95))useElevator();}

const mapped=new Set(['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyK','KeyJ','Space','KeyL','ShiftLeft','ShiftRight']);
window.addEventListener('keydown',e=>{if(mapped.has(e.code)){if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;e.preventDefault();if(state==='playing'&&!puzzleOpen)keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();doAction();}if(e.code==='Escape'&&!e.repeat){if(puzzleOpen)closePuzzle();else pause();}});
window.addEventListener('keyup',e=>keys.delete(e.code));
for(const button of buttons){button.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='playing'||puzzleOpen||progress.mode==='elevator')return;unlockAudio();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.action);button.classList.add('held');});const release=e=>{touch.delete(e.pointerId);if(![...touch.values()].includes(button.dataset.action))button.classList.remove('held');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
$('action').addEventListener('click',doAction);$('puzzle-close').addEventListener('click',closePuzzle);
$('play').addEventListener('click',()=>{if(state==='paused'){pause();return;}play();$('overlay').querySelector('.chapter-tag').textContent='ABODEN HERO / CHAPTER 02';$('overlay').querySelector('.eyebrow').textContent='ROOFTOP ELEVATOR';$('overlay').querySelector('h1').innerHTML='ستة طوابق.<br><em>طريق واحد للأعلى.</em>';$('overlay-description').textContent='قاتل في طابق، حل لغزًا في التالي، وشغّل المصعد للوصول إلى غرفة التحكم.';$('play').textContent='ابدأ الفصل الثاني ◀';});
$('pause').addEventListener('click',pause);$('sound').addEventListener('click',()=>{muted=!muted;unlockAudio();musicCtl?.setMuted(muted);$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)sound(660,.12);});
window.addEventListener('blur',()=>{clearInput();if(state==='playing'&&!puzzleOpen)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(state==='playing'&&!puzzleOpen)pause();}});
reset();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__stage2={get progress(){return progress;},get player(){return player;},get enemies(){return enemySets.get(progress.currentFloor)??[];},get state(){return state;},tick,play,reset,finishChallenge,useElevator,openPuzzle};
