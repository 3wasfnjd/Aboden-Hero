// Pure simulation module: the renderer never determines collision geometry.
export const WORLD_WIDTH=6600;
export const TUNING=Object.freeze({speed:290,groundAccel:2100,airAccel:1550,groundBrake:2400,airBrake:650,gravity:1450,jump:-570,jumpCut:-225,coyote:.12,buffer:.14});
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const approach=(v,t,n)=>v<t?Math.min(v+n,t):Math.max(v-n,t);
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function chapter1(){
 const ground=[[0,1430],[1540,1330],[2990,1370],[4490,2110]].map(([x,w])=>({x,y:440,w,h:130,ground:true}));
 const ledges=[[400,370,160],[670,305,155],[980,365,175],[1710,365,175],[1960,300,170],[2210,365,170],[2610,362,160],[3130,368,180],[3390,300,180],[3680,355,200],[4090,365,185],[4660,366,200],[4950,300,180],[5230,358,190],[5610,368,190],[5900,310,175]];
 const enemySpecs=[[850,760,1170],[1820,1600,1910],[2430,2330,2670],[3300,3060,3370],[3940,3860,4220],[4810,4560,4900],[5480,5420,5670],[6070,6000,6220]];
 return {chapter:1,width:WORLD_WIDTH,
 signs:[[260,'J إطلاق • L اندفاع'],[1350,'اقفز عبر الفجوة'],[2830,'احذر نيران الحراس'],[5530,'حارس البوابة أمامك']],
 areas:[[1540,'أطراف المدينة'],[2990,'الحي الصناعي'],[4490,'الطريق المحاصر'],[5650,'المستودعات'],[Infinity,'المواجهة الأخيرة']],
 solids:[...ground,...ledges.map(([x,y,w])=>({x,y,w,h:20,oneWay:true}))],
 coins:[...Array.from({length:31},(_,i)=>({x:270+i*198,y:407})),...ledges.flatMap(([x,y,w])=>[.25,.5,.75].map(f=>({x:x+w*f,y:y-25})))].filter(c=>![[1410,1560],[2850,3010],[4340,4510],[2050,2140],[3760,3860],[5340,5440]].some(([a,b])=>c.x>a&&c.x<b&&c.y>400)).map((c,id)=>({...c,id,taken:false})),
 enemies:enemySpecs.map(([x,min,max],i)=>{const slot=Math.floor((min+250)/900)%3;const kind=slot===0?'city':slot===1?'sniper':'heavy';return {x,y:408,w:34,h:32,min,max,vx:i%2?48:-48,hp:3,hit:0,fire:1.2+i*.16,windup:0,aimX:0,aimY:0,kind};}),
 spikes:[{x:2070,y:424,w:50,h:16},{x:3780,y:424,w:55,h:16},{x:5360,y:424,w:55,h:16}],
 checkpoints:[{x:1630,active:false},{x:3060,active:false},{x:4580,active:false},{x:5700,active:false}],hearts:[{x:2350,y:333,taken:false},{x:4220,y:333,taken:false},{x:5750,y:336,taken:false}],boss:{x:6130,y:360,w:72,h:80,hp:24,maxHP:24,active:false,fire:1.4,windup:0,aimX:0,aimY:0,hit:0,triggerX:5630},goal:{x:6410,y:315,w:90,h:125}};
}
// Rooftop finale: a REAL vertical climb — three short rooftop shafts, each
// climbed floor-by-floor (camera follows player.y, not player.x; the shaft is
// narrower than the canvas so there is nothing to scroll horizontally), each
// ending at a puzzle terminal that unlocks a gate to a service elevator car.
// The car is a genuine moving platform (main.js drives elevator.y toward
// elevator.topY over real time while the player rides it up) rather than an
// instant floor swap — only once the ride finishes does the next floor load.
export const CHAPTER2_FLOORS=4;
const mkEnemy=(x,min,max,kind,extra={})=>({x,y:408,w:34,h:32,min,max,vx:x%2?48:-48,hp:3,hit:0,fire:1.3,windup:0,aimX:0,aimY:0,kind,...extra});
const dummyBoss=()=>({x:-1000,y:-1000,w:1,h:1,hp:0,maxHP:1,active:false,fire:99,windup:0,aimX:0,aimY:0,hit:0,triggerX:-1,kind:'captain'});
const offGoal=()=>({x:-1000,y:-1000,w:1,h:1,chapter:2});
function floorCoins(width,ledges){
 return ledges.flatMap(l=>[.3,.7].map(f=>({x:l.x+l.w*f,y:l.y-24}))).map((c,id)=>({...c,id,taken:false}));
}
// Nine ledges climbing from the rooftop's ground up to the terminal, zig-zagging
// left/right by a margin proven (via a jump-reachability sweep) to be clearable
// with a released-then-re-pressed jump between each step.
const CLIMB_STEP=100,CLIMB_LEDGE_W=180;
function climbLedges(width,startY,count){
 const shift=(width-CLIMB_LEDGE_W)*0.4;
 const leftX=(width-CLIMB_LEDGE_W)/2-shift/2,rightX=(width-CLIMB_LEDGE_W)/2+shift/2;
 return Array.from({length:count},(_,i)=>({x:i%2===0?leftX:rightX,y:startY-i*CLIMB_STEP,w:CLIMB_LEDGE_W}));
}
// A puzzle-gated vertical floor: climb past a couple of enemies to a terminal;
// solving it removes the gate blocking the last step up to the elevator car.
function puzzleFloor(floor,puzzle,label,sign,enemySpecs,extraHeart){
 const WIDTH=460,GROUND_Y=440,CLIMB_COUNT=9;
 const ledges=climbLedges(WIDTH,340,CLIMB_COUNT);
 const top=ledges[CLIMB_COUNT-1];
 const carLedge={x:top.x,y:top.y-CLIMB_STEP,w:top.w};
 const gateY=top.y-75; // clears the jump arc onto the top ledge but blocks the one past it to the car
 const enemies=enemySpecs.map(([ledgeIdx,kind,extra])=>{
  const l=ledges[ledgeIdx];
  return mkEnemy(l.x+l.w/2-17,l.x+10,l.x+l.w-44,kind,{y:l.y-32,...extra});
 });
 return {chapter:2,floor,totalFloors:CHAPTER2_FLOORS,width:WIDTH,vertical:true,bottomY:GROUND_Y,topY:carLedge.y-40,
 signs:[[GROUND_Y-40,'تسلّق الأسطح — قفزة دقيقة توصلك للأعلى']],
 areas:[[Infinity,label]],
 solids:[{x:0,y:GROUND_Y,w:WIDTH,h:130,ground:true},...ledges.map(l=>({x:l.x,y:l.y,w:l.w,h:20,oneWay:true,chapter:2})),
  {x:top.x,y:gateY,w:top.w,h:20,locked:true,chapter:2}],
 coins:floorCoins(WIDTH,ledges),
 enemies,
 spikes:[],
 checkpoints:[{x:WIDTH/2-15,active:false}],
 hearts:extraHeart!=null?[{x:ledges[extraHeart].x+ledges[extraHeart].w/2,y:ledges[extraHeart].y-30,taken:false}]:[],
 terminal:{x:top.x+top.w/2-20,y:top.y-50,w:40,h:50,kind:puzzle,solved:false},
 elevator:{x:carLedge.x,y:carLedge.y,w:carLedge.w,h:14,restY:carLedge.y,topY:carLedge.y-520,riding:false},
 sign2:sign,
 boss:dummyBoss(),goal:offGoal()};
}
function chapter2Floor1(){
 return puzzleFloor(1,'pipes','الطابق الأول ✦ لوحة التوصيل','لوح كهربائي يغلق الباب — رتّب الأنابيب لفتحه',[
  [2,'heavy',{shield:true}],
  [5,'sniper',{}],
 ],7);
}
function chapter2Floor2(){
 return puzzleFloor(2,'cubes','الطابق الثاني ✦ غرفة المكعبات','رتّب المكعبات لتوصيل الطاقة من البداية للهدف',[
  [2,'heavy',{shield:true}],
  [6,'heavy',{flying:true,w:40,h:28,hp:6,fire:1.5}],
 ],4);
}
function chapter2Floor3(){
 return puzzleFloor(3,'match','الطابق الثالث ✦ لوحة المطابقة','طابِق كل رمز مع لونه لفتح الباب الأخير',[
  [1,'heavy',{shield:true}],
  [4,'city',{}],
  [7,'sniper',{}],
 ],5);
}
function chapter2Floor4(){
 const WIDTH=1900;
 const ground=[[0,900],[1000,900]].map(([x,w])=>({x,y:440,w,h:130,ground:true}));
 const ledges=[[1300,300,180]];
 return {chapter:2,floor:4,totalFloors:CHAPTER2_FLOORS,width:WIDTH,
 signs:[[200,'قمة الحصار — قائد الحرس أمامك']],
 areas:[[Infinity,'قمة الحصار']],
 solids:[...ground,...ledges.map(([x,y,w])=>({x,y,w,h:20,oneWay:true,chapter:2}))],
 coins:floorCoins(WIDTH,ledges,[[900,1000]]),
 enemies:[mkEnemy(1200,1050,1350,'sniper')],
 spikes:[],
 checkpoints:[{x:1000,active:false}],
 hearts:[{x:1500,y:333,taken:false}],
 terminal:null,elevator:null,
 boss:{x:1700,y:360,w:72,h:80,hp:30,maxHP:30,active:false,fire:1.3,windup:0,aimX:0,aimY:0,hit:0,triggerX:1450,kind:'captain'},
 goal:{x:1820,y:315,w:90,h:125,chapter:2}};
}
const CHAPTER2_BUILDERS=[chapter2Floor1,chapter2Floor2,chapter2Floor3,chapter2Floor4];
function chapter2(floor=1){return CHAPTER2_BUILDERS[clamp(floor,1,CHAPTER2_FLOORS)-1]();}
export const CHAPTER_COUNT=2;
export function createLevel(chapter=1,floor=1){return chapter===2?chapter2(floor):chapter1();}
export function createPlayer(x=110,y=390){return {dashTime:0,dashCooldown:0,dashHeld:false,x,y,w:30,h:44,vx:0,vy:0,facing:1,grounded:false,coyote:0,buffer:0,jumpHeld:false,invulnerable:0,hp:5,shot:0};}
export function stepPlayer(p,input,solids,dt,width=WORLD_WIDTH){
 p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 p.dashTime=Math.max(0,p.dashTime-dt);
 if(input.dash&&!p.dashHeld&&p.dashCooldown<=0){p.dashTime=.17;p.dashCooldown=1.35;}
 p.dashHeld=!!input.dash;
 p.coyote=p.grounded?TUNING.coyote:Math.max(0,p.coyote-dt);
 p.buffer=input.jump&&!p.jumpHeld?TUNING.buffer:Math.max(0,p.buffer-dt);
 const axis=Number(input.right)-Number(input.left);if(axis)p.facing=axis;
 p.vx=p.dashTime>0?p.facing*760:approach(p.vx,axis*TUNING.speed,(axis?(p.grounded?TUNING.groundAccel:TUNING.airAccel):(p.grounded?TUNING.groundBrake:TUNING.airBrake))*dt);
 let jumped=false,landed=false;
 if(p.buffer>0&&p.coyote>0){p.vy=TUNING.jump;p.buffer=0;p.coyote=0;p.grounded=false;jumped=true;}
 if(!input.jump&&p.vy<TUNING.jumpCut)p.vy=TUNING.jumpCut;
 p.jumpHeld=input.jump;p.vy=Math.min(p.vy+TUNING.gravity*dt,850);
 p.x=clamp(p.x+p.vx*dt,0,width-p.w);
 for(const s of solids)if(!s.oneWay&&overlaps(p,s)){p.x=p.vx>0?s.x-p.w:s.x+s.w;p.vx=0;}
 const oldBottom=p.y+p.h;p.y+=p.vy*dt;p.grounded=false;
 for(const s of solids){if(p.x+p.w<=s.x||p.x>=s.x+s.w)continue;
  if(p.vy>=0&&oldBottom<=s.y+1&&p.y+p.h>=s.y){landed=p.vy>200;p.y=s.y-p.h;p.vy=0;p.grounded=true;}
  else if(!s.oneWay&&p.vy<0&&overlaps(p,s)){p.y=s.y+s.h;p.vy=0;}
 }
 p.invulnerable=Math.max(0,p.invulnerable-dt);p.shot=Math.max(0,p.shot-dt);return {jumped,landed};
}
