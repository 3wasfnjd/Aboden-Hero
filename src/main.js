import {WORLD_WIDTH,clamp,overlaps,createLevel,createPlayer,stepPlayer} from './world.js';
import {createArt} from './art.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),art=createArt(ctx);
const W=960,H=540,STEP=1/120;
const keys=new Set(),touch=new Map(),buttons=[...document.querySelectorAll('[data-action]')];
let level,player,state='menu',camera=0,time=0,elapsed=0,collected=0,kills=0,deaths=0,checkpoint=110,bullets=[],particles=[],toastTime=0,accumulator=0,last=0,muted=true,audio=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Seeded, cached paper grain: created once, never randomized during a frame.
const paper=document.createElement('canvas');paper.width=256;paper.height=256;
const pc=paper.getContext('2d'),grain=pc.createImageData(256,256);let seed=127;
for(let i=0;i<grain.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=seed%2?45:255;grain.data[i]=v;grain.data[i+1]=v;grain.data[i+2]=v;grain.data[i+3]=seed%15;}
pc.putImageData(grain,0,0);const paperPattern=ctx.createPattern(paper,'repeat');
function reset(){level=createLevel();player=createPlayer();checkpoint=110;camera=0;time=0;elapsed=0;collected=0;kills=0;deaths=0;bullets=[];particles=[];clearInput();updateHUD();}
function clearInput(){keys.clear();touch.clear();buttons.forEach(b=>b.classList.remove('held'));if(player){player.jumpHeld=false;player.buffer=0;}}
function input(){const active=a=>[...touch.values()].includes(a);return {left:keys.has('ArrowLeft')||keys.has('KeyA')||active('left'),right:keys.has('ArrowRight')||keys.has('KeyD')||active('right'),jump:keys.has('ArrowUp')||keys.has('KeyK')||active('jump'),shoot:keys.has('KeyJ')||keys.has('Space')||active('shoot')};}
function sound(freq=440,duration=.09,type='sine',volume=.045){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.55,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function unlockAudio(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{muted=true;}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');toastTime=2.6;}
function burst(x,y,color='#efd598',count=8){for(let i=0;i<count;i++){const a=i*Math.PI*2/count;particles.push({x,y,vx:Math.cos(a)*(35+i*9),vy:Math.sin(a)*80-35,life:.45,max:.45,color});}}
function updateHUD(){$('health').textContent='♥'.repeat(player.hp)+'♡'.repeat(5-player.hp);$('health').setAttribute('aria-label',`الصحة ${player.hp} من 5`);$('coins').textContent=collected;$('area').textContent=player.x<1540?'بداية الحكاية':player.x<2990?'قرية الفطر':player.x<4490?'الجسر القديم':'بوابة الوادي';$('progress').style.width=`${clamp(player.x/6410*100,0,100)}%`;}
function showOverlay(kind){state=kind;clearInput();$('overlay').hidden=false;$('pills').hidden=kind!=='menu';
 if(kind==='paused'){$('eyebrow').textContent='✦ استراحة قصيرة ✦';$('title').innerHTML='الحكاية<br><em>بانتظارك.</em>';$('description').textContent='توقفت اللعبة. أكمل من مكانك عندما تكون جاهزًا.';$('play').textContent='نكمل المغامرة ◀';}
 if(kind==='won'){$('eyebrow').textContent='✦ اكتمل الفصل الأول ✦';$('title').innerHTML='وصلت<br><em>يا بطل!</em>';$('description').textContent=`جمعت ${collected} من ${level.coins.length} نجمة، وتجاوزت ${kills} حراس. الوقت ${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')} • مرات العودة ${deaths}`;$('play').textContent='العب من جديد ↻';}
 $('pause').textContent='▶';$('pause').setAttribute('aria-label','متابعة اللعب');
}
function play(){unlockAudio();if(state==='menu'||state==='won')reset();state='playing';$('overlay').hidden=true;$('hud').hidden=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','إيقاف مؤقت');clearInput();last=performance.now();accumulator=0;}
function pause(){if(state==='playing')showOverlay('paused');else if(state==='paused')play();}
function respawn(){deaths++;player=createPlayer(checkpoint,390);player.invulnerable=1.8;bullets=[];camera=clamp(checkpoint-250,0,WORLD_WIDTH-W);burst(player.x+15,420);toast('محاولة جديدة — عدت إلى آخر نقطة حفظ');sound(180,.2,'triangle');updateHUD();}
function hurt(){if(player.invulnerable>0)return;player.hp--;player.invulnerable=1.35;burst(player.x+15,player.y+20,'#bc6245',10);sound(160,.18,'sawtooth',.025);if(player.hp<=0)respawn();else updateHUD();}
function tick(dt){if(state!=='playing')return;time+=dt;elapsed+=dt;const controls=input();const previousBottom=player.y+player.h;
 const {jumped,landed}=stepPlayer(player,controls,level.solids,dt);if(jumped){burst(player.x+15,player.y+44,'#ddd1a4',5);sound(510,.12,'triangle');}if(landed)burst(player.x+15,player.y+44,'#ddd1a4',5);
 if(player.y>620){respawn();return;}
 if(controls.shoot&&player.shot<=0){player.shot=.19;bullets.push({x:player.x+15+player.facing*24,y:player.y+18,w:13,h:8,vx:player.facing*620,life:1});sound(660,.055,'triangle',.025);}
 for(const e of level.enemies){if(e.hp<=0)continue;e.x+=e.vx*dt;e.hit=Math.max(0,e.hit-dt);if(e.x<e.min){e.x=e.min;e.vx=Math.abs(e.vx);}if(e.x+e.w>e.max){e.x=e.max-e.w;e.vx=-Math.abs(e.vx);}
  if(overlaps(player,e)){if(player.vy>70&&previousBottom<=e.y+10){e.hp=0;kills++;player.vy=-390;player.coyote=0;burst(e.x+17,e.y+16,'#e0b164',12);sound(280,.12,'triangle');}else hurt();}
 }
 for(const b of bullets){b.x+=b.vx*dt;b.life-=dt;if(level.solids.some(s=>overlaps(b,s)))b.life=0;if(b.life<=0)continue;
  for(const e of level.enemies){if(e.hp>0&&overlaps(b,e)){b.life=0;e.hp--;e.hit=.12;burst(b.x,b.y,'#e6c878',5);if(e.hp<=0){kills++;burst(e.x+17,e.y+16,'#d7b975',10);}break;}}
 }
 bullets=bullets.filter(b=>b.life>0);
 for(const coin of level.coins)if(!coin.taken&&overlaps(player,{x:coin.x-12,y:coin.y-12,w:24,h:24})){coin.taken=true;collected++;burst(coin.x,coin.y,'#eed089',6);sound(850+collected%4*110,.08);updateHUD();}
 for(const heart of level.hearts)if(!heart.taken&&player.hp<5&&overlaps(player,{x:heart.x-12,y:heart.y-12,w:24,h:24})){heart.taken=true;player.hp++;sound(720,.15);burst(heart.x,heart.y,'#c77764');updateHUD();}
 for(const cp of level.checkpoints)if(!cp.active&&player.x>cp.x&&player.grounded){cp.active=true;checkpoint=cp.x+20;player.hp=5;toast('تم حفظ تقدمك واستعادة الصحة ✦');sound(920,.2);updateHUD();}
 for(const s of level.spikes)if(overlaps(player,s))hurt();
 if(overlaps(player,level.goal)){burst(player.x,player.y,'#efcf7e',25);sound(1100,.4);showOverlay('won');}
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
 camera+=(clamp(player.x-280,0,WORLD_WIDTH-W)-camera)*(1-Math.exp(-7*dt));
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('show');}
 updateHUD();
}
function draw(){ctx.clearRect(0,0,W,H);art.background(camera,reducedMotion?0:time);art.scenery(camera);ctx.save();ctx.translate(-camera,0);
 const visible=(x,w=100)=>x+w>camera-100&&x<camera+W+100;
 for(const cp of level.checkpoints)if(visible(cp.x))art.checkpoint(cp,time);
 art.sign(260,'↑ قفز   •   J إطلاق');art.sign(1350,'انتبه للفجوة!');art.sign(2830,'اقفز إلى الضفة');art.sign(4320,'البوابة قريبة ←');
 for(const s of level.solids)if(visible(s.x,s.w))art.platform(s);
 for(const s of level.spikes)if(visible(s.x)){for(let x=s.x;x<s.x+s.w;x+=13)art.path(`M${x} 440 L${x+6} 424 L${x+13} 440Z`,'#b48568');}
 for(let x=Math.floor(camera/85)*85;x<camera+W+85;x+=85)if(level.solids.some(s=>s.ground&&x>s.x+10&&x<s.x+s.w-10))art.flower(x,443,.55+(x%3)*.12);
 for(const cp of level.coins)if(!cp.taken&&visible(cp.x))art.star(cp.x,cp.y+Math.sin(time*3+cp.id)*3,10,'#edce78',Math.sin(time*2+cp.id)*.12);
 for(const h of level.hearts)if(!h.taken&&visible(h.x)){ctx.fillStyle='#bc6554';ctx.font='25px Tahoma';ctx.textAlign='center';ctx.strokeStyle='#584631';ctx.lineWidth=3;ctx.strokeText('♥',h.x,h.y+8);ctx.fillText('♥',h.x,h.y+8);}
 for(const e of level.enemies)if(e.hp>0&&visible(e.x))art.enemy(e,time);
 art.goal(level.goal,time);
 for(const b of bullets){art.ellipse(b.x+6,b.y+4,9,5,'#f2dc92','#7e6843',2);art.line(b.x-b.vx/90,b.y+4,b.x,b.y+4,'#e6d3a0',3);}
 if(player.invulnerable===0||Math.floor(time*14)%2===0)art.hero(player,time);
 for(const p of particles){ctx.globalAlpha=p.life/p.max;art.ellipse(p.x,p.y,3,3,p.color,null);}ctx.globalAlpha=1;ctx.restore();
 // Texture sits over the painted world, never on interactive HTML text.
 ctx.fillStyle=paperPattern;ctx.fillRect(0,0,W,H);
 const vignette=ctx.createRadialGradient(480,240,180,480,270,580);vignette.addColorStop(0,'#342b1c00');vignette.addColorStop(1,'#342b1c2e');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
}
function frame(now){if(!last)last=now;const dt=Math.min((now-last)/1000,.1);last=now;if(state==='playing'){accumulator+=dt;while(accumulator>=STEP){tick(STEP);accumulator-=STEP;}}else if(state==='menu'&&!reducedMotion)time+=dt;draw();requestAnimationFrame(frame);}
const mapped=new Set(['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyK','KeyJ','Space']);
window.addEventListener('keydown',e=>{if(mapped.has(e.code)){if(e.target instanceof HTMLButtonElement&&(e.code==='Space'))return;e.preventDefault();if(state==='playing')keys.add(e.code);}if(e.code==='Escape'&&!e.repeat)pause();});
window.addEventListener('keyup',e=>keys.delete(e.code));
for(const button of buttons){button.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='playing')return;unlockAudio();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.action);button.classList.add('held');});const release=e=>{touch.delete(e.pointerId);if(![...touch.values()].includes(button.dataset.action))button.classList.remove('held');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
window.addEventListener('blur',()=>{clearInput();if(state==='playing')showOverlay('paused');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(state==='playing')showOverlay('paused');}});
document.addEventListener('contextmenu',e=>{if(e.target.closest('#controls'))e.preventDefault();});
$('play').addEventListener('click',()=>{play();$('play').blur();});$('pause').addEventListener('click',()=>{pause();$('pause').blur();});
$('sound').addEventListener('click',()=>{muted=!muted;unlockAudio();$('sound').textContent=muted?'♪':'♫';$('sound').setAttribute('aria-label',muted?'تشغيل الصوت':'كتم الصوت');$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)sound(660,.15);$('sound').blur();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('استخدم الوضع الأفقي لعرض أكبر');}catch{toast('ملء الشاشة غير متاح في هذا المتصفح');}$('fullscreen').blur();});
reset();requestAnimationFrame(frame);
// Opt-in local test harness; absent from normal game sessions.
if(new URLSearchParams(location.search).has('test'))window.__game={get player(){return player;},get level(){return level;},get state(){return state;},get checkpoint(){return checkpoint;},get bullets(){return bullets;},get input(){return input();},get stats(){return {collected,kills,deaths,elapsed};},tick,play,pause,reset,respawn,draw};
