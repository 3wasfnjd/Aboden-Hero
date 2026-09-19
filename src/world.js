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
// Rooftop finale: shorter, gappier and vertical, with shield-carrying guards
// and a hovering gunner mini-boss above the midpoint before the captain's stand.
function chapter2(){
 const WIDTH=5300;
 const ground=[[0,950],[1080,900],[2120,950],[3200,2100]].map(([x,w])=>({x,y:440,w,h:130,ground:true}));
 const ledges=[[550,365,150],[1300,300,160],[1650,360,150],[2400,300,170],[2700,360,160],[3500,300,180],[3850,360,170],[4200,300,190]];
 const mkEnemy=(x,min,max,kind,extra={})=>({x,y:408,w:34,h:32,min,max,vx:x%2?48:-48,hp:3,hit:0,fire:1.3,windup:0,aimX:0,aimY:0,kind,...extra});
 return {chapter:2,width:WIDTH,
 signs:[[200,'احذر: تحتاج دقة بالقفز فوق الأسطح'],[1200,'دروع تحمي بعض الحراس — التف خلفهم'],[2300,'طائرة مراقبة — لا تقف تحتها طويلًا'],[3900,'قائد الحرس أمامك']],
 areas:[[1080,'مدخل الأسطح'],[2120,'ممرات الصيانة'],[3200,'برج المراقبة'],[4450,'الملجأ الأخير'],[Infinity,'قمة الحصار']],
 solids:[...ground,...ledges.map(([x,y,w])=>({x,y,w,h:20,oneWay:true}))],
 coins:[...Array.from({length:22},(_,i)=>({x:220+i*198,y:407})),...ledges.flatMap(([x,y,w])=>[.25,.5,.75].map(f=>({x:x+w*f,y:y-25})))].filter(c=>![[950,1080],[1980,2120],[3070,3200]].some(([a,b])=>c.x>a&&c.x<b&&c.y>400)).map((c,id)=>({...c,id,taken:false})),
 enemies:[
  mkEnemy(300,150,550,'heavy',{shield:true}),
  mkEnemy(750,600,900,'sniper'),
  mkEnemy(1300,1150,1550,'heavy',{shield:true}),
  mkEnemy(2500,2200,2900,'heavy',{flying:true,y:280,w:40,h:28,hp:6,fire:1.5}),
  mkEnemy(3400,3250,3650,'heavy',{shield:true}),
  mkEnemy(4000,3850,4200,'city'),
  mkEnemy(4650,4500,4800,'sniper'),
 ],
 spikes:[{x:1400,y:424,w:50,h:16},{x:4500,y:424,w:55,h:16}],
 checkpoints:[{x:1900,active:false},{x:3900,active:false}],
 hearts:[{x:1500,y:333,taken:false},{x:3800,y:333,taken:false}],
 boss:{x:4950,y:360,w:72,h:80,hp:30,maxHP:30,active:false,fire:1.3,windup:0,aimX:0,aimY:0,hit:0,triggerX:4450,kind:'captain'},
 goal:{x:5150,y:315,w:90,h:125}};
}
export const CHAPTER_COUNT=2;
export function createLevel(chapter=1){return chapter===2?chapter2():chapter1();}
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
