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
export function fallbackMuzzle(p,time){
 const moving=p.grounded&&Math.abs(p.vx)>20;
 const bob=moving?Math.abs(Math.sin(time*21))*1.5:Math.sin(time*3)*.5;
 const lean=p.dashTime>0?-.2:0;
 return {x:p.x+p.w/2+p.facing*(45+lean*-36.5),y:p.y+p.h-bob-36.5};
}
export function makeHeroBullet(muzzle,facing){
 // x/y are the collision box top-left; muzzle is its CENTER for both directions.
 return {x:muzzle.x-6.5,y:muzzle.y-4,w:13,h:8,vx:facing*620,life:1};
}
export function enemyDisplayHeight(e){
 const slot=Math.floor(((e.min??e.x)+250)/900)%3;
 const kind=e.kind??(slot===0?'city':slot===1?'sniper':'heavy');
 return kind==='heavy'?88:kind==='sniper'?80:76;
}
export function bulletTargetBounds(e){
 // Extend only projectile reception to the visible torso/head. Walking and
 // platform collision remain unchanged. Boss already has a tall body box.
 const height=e.maxHP?e.h:enemyDisplayHeight(e)*.9;
 return {x:e.x,y:e.y+e.h-height,w:e.w,h:height};
}
