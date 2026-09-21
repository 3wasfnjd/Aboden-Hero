// Coordinates are measured in the 1254×1254 hero atlas, before mirroring/scaling.
// Use the barrel mouth, not the tip of the painted muzzle flash.
export const HERO_FIRE_FRAMES=[
 [173,593,168,180], [349,594,207,180],
 [552,594,196,180], [733,592,218,182]
];
export const HERO_FIRE_MUZZLES=[[338,624],[510,624],[708,624],[901,622]];
export const SHOT_INTERVAL=.14;
export const FIRE_POSE_END=.02;
export const HERO_FIRE_HEIGHT=82;
export function heroFirePose(p){
 const age=Math.max(0,SHOT_INTERVAL-p.shot);
 const index=Math.min(3,Math.floor(age*30+1e-8));
 const frame=HERO_FIRE_FRAMES[index];
 const [fx,fy,fw,fh]=frame,[mx,my]=HERO_FIRE_MUZZLES[index];
 const scale=HERO_FIRE_HEIGHT/fh;
 return {frame,index,height:HERO_FIRE_HEIGHT,muzzle:{
  x:p.x+p.w/2+p.facing*(mx-fx-fw/2)*scale,
  y:p.y+p.h+(my-fy-fh)*scale
 }};
}
export function makeHeroBullet(muzzle,facing){
 // x/y are the collision box top-left; muzzle is its CENTER for both directions.
 return {x:muzzle.x-6.5,y:muzzle.y-4,w:13,h:8,vx:facing*620,life:1};
}
export function enemyDisplayHeight(e){
 const slot=Math.floor(((e.min??e.x)+250)/900)%3;
 const kind=e.kind??(slot===0?'city':slot===1?'sniper':'heavy');
 if(kind==='drone')return 82;
 if(kind==='newguard')return 102;
 return kind==='heavy'?112:kind==='sniper'?100:96;
}
export function bulletTargetBounds(e){
 const kind=e.kind;
 if(kind==='drone')return {x:e.x-10,y:e.y-16,w:e.w+20,h:e.h+32};
 const height=e.maxHP?e.h:enemyDisplayHeight(e)*.9;
 return {x:e.x,y:e.y+e.h-height,w:e.w,h:height};
}
