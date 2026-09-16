// Pure simulation module: the renderer never determines collision geometry.
export const WORLD_WIDTH=6600;
export const TUNING=Object.freeze({speed:290,groundAccel:2100,airAccel:1550,groundBrake:2400,airBrake:650,gravity:1450,jump:-570,jumpCut:-225,coyote:.12,buffer:.14});
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const approach=(v,t,n)=>v<t?Math.min(v+n,t):Math.max(v-n,t);
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function createLevel(){
 const ground=[[0,1430],[1540,1330],[2990,1370],[4490,2110]].map(([x,w])=>({x,y:440,w,h:130,ground:true}));
 const ledges=[[400,370,160],[670,305,155],[980,365,175],[1710,365,175],[1960,300,170],[2210,365,170],[2610,362,160],[3130,368,180],[3390,300,180],[3680,355,200],[4090,365,185],[4660,366,200],[4950,300,180],[5230,358,190],[5610,368,190],[5900,310,175]];
 return {solids:[...ground,...ledges.map(([x,y,w])=>({x,y,w,h:20,oneWay:true}))],
 coins:[...Array.from({length:31},(_,i)=>({x:270+i*198,y:407})),...ledges.flatMap(([x,y,w])=>[.25,.5,.75].map(f=>({x:x+w*f,y:y-25})))].filter(c=>![[1410,1560],[2850,3010],[4340,4510],[2050,2140],[3760,3860],[5340,5440]].some(([a,b])=>c.x>a&&c.x<b&&c.y>400)).map((c,id)=>({...c,id,taken:false})),
 enemies:[[850,760,1170],[1820,1600,1910],[2430,2330,2670],[3300,3060,3370],[3940,3860,4220],[4810,4560,4900],[5480,5420,5670],[6070,6000,6220]].map(([x,min,max],i)=>({x,y:408,w:34,h:32,min,max,vx:i%2?48:-48,hp:3,hit:0,fire:1.2+i*.16,windup:0,aimX:0,aimY:0})),
 spikes:[{x:2070,y:424,w:50,h:16},{x:3780,y:424,w:55,h:16},{x:5360,y:424,w:55,h:16}],
 checkpoints:[{x:1630,active:false},{x:3060,active:false},{x:4580,active:false},{x:5700,active:false}],hearts:[{x:2350,y:333,taken:false},{x:4220,y:333,taken:false},{x:5750,y:336,taken:false}],boss:{x:6130,y:360,w:72,h:80,hp:24,maxHP:24,active:false,fire:1.4,windup:0,aimX:0,aimY:0,hit:0},goal:{x:6410,y:315,w:90,h:125}};
}
export function createPlayer(x=110,y=390){return {dashTime:0,dashCooldown:0,dashHeld:false,x,y,w:30,h:44,vx:0,vy:0,facing:1,grounded:false,coyote:0,buffer:0,jumpHeld:false,invulnerable:0,hp:5,shot:0};}
export function stepPlayer(p,input,solids,dt){
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
 p.x=clamp(p.x+p.vx*dt,0,WORLD_WIDTH-p.w);
 for(const s of solids)if(!s.oneWay&&overlaps(p,s)){p.x=p.vx>0?s.x-p.w:s.x+s.w;p.vx=0;}
 const oldBottom=p.y+p.h;p.y+=p.vy*dt;p.grounded=false;
 for(const s of solids){if(p.x+p.w<=s.x||p.x>=s.x+s.w)continue;
  if(p.vy>=0&&oldBottom<=s.y+1&&p.y+p.h>=s.y){landed=p.vy>200;p.y=s.y-p.h;p.vy=0;p.grounded=true;}
  else if(!s.oneWay&&p.vy<0&&overlaps(p,s)){p.y=s.y+s.h;p.vy=0;}
 }
 p.invulnerable=Math.max(0,p.invulnerable-dt);p.shot=Math.max(0,p.shot-dt);return {jumped,landed};
}
