import {enemyDisplayHeight} from './hero-weapon.js?v=20260921-cleanup-1';

export const BOSS_FRAMES={
 idle:[[146,13,191,187],[347,10,189,190],[546,10,189,190],[747,14,189,186]],
 aim:[[147,214,209,175],[374,214,209,175],[616,215,240,174]],
 charge:[[147,404,225,173],[401,403,242,174],[663,400,231,177]],
 fire:[[143,589,261,164],[401,588,271,165],[655,587,248,166],[896,587,237,165]],
 hit:[[147,768,196,165],[374,767,190,166]],
 enraged:[[153,942,218,159],[394,944,217,157],[634,930,236,172]],
 death:[[127,1110,125,129],[255,1113,125,126],[382,1124,117,115],[498,1134,129,105],[622,1139,152,100],[770,1150,142,89],[915,1144,167,95],[1084,1143,157,94]]
};

export const CITY_FRAMES={
 idle:[[42,25,145,250],[226,25,151,250],[408,25,146,250],[584,25,138,250]],
 run:[[42,25,145,250],[226,25,151,250],[408,25,146,250],[584,25,138,250]],
 aim:[[34,292,165,210],[215,292,186,210],[404,292,205,210]],
 hit:[[45,940,162,165],[235,940,148,165]],
};

export const HEAVY_FRAMES={
 idle:[[30,20,178,270],[216,20,176,270],[399,20,171,270],[583,20,178,270]],
 run:[[30,20,178,270],[216,20,176,270],[399,20,171,270],[583,20,178,270]],
 aim:[[16,292,226,212],[226,292,222,212],[421,292,248,212]],
 hit:[[18,945,224,250],[230,945,180,250]],
};

export const SNIPER_FRAMES={
 idle:[[255,15,165,240],[416,15,165,240],[574,15,165,240],[734,15,176,240]],
 run:[[255,15,165,240],[416,15,165,240],[574,15,165,240],[734,15,176,240]],
 aim:[[220,258,236,225],[438,258,256,225],[671,258,277,225]],
 hit:[[70,900,205,230],[70,900,205,230]],
};

// Barrel mouths in source-atlas pixels; exclude painted flashes and smoke.
// Guard atlases: 1122×1402. Gatekeeper atlas: 1254×1254.
const MUZZLES={
 city:{aim:[[187,359],[388,337],[598,340]]},
 heavy:{aim:[[231,350],[437,350],[656,350]]},
 sniper:{aim:[[445,385],[683,321],[936,316]]},
 boss:{aim:[[0,0],[581,276],[850,265]],charge:[[369,480],[632,482],[886,478]],fire:[[333,638],[581,636],[853,636],[1075,638]]}
};
export const ENEMY_FLASH_TIME=.2;
export function enemyKind(e){
 if(e.kind)return e.kind;
 const slot=Math.floor(((e.min??e.x)+250)/900)%3;
 return slot===0?'city':slot===1?'sniper':'heavy';
}
export function enemyAttackPose(e,isBoss=false){
 let state,index,height;
 if(e.windup>0){
  if(isBoss&&e.windup<=.31){state='charge';index=Math.min(2,Math.floor((.31-e.windup)*10));height=148;}
  else{
   // The first aim frame has its gun lowered. Use the two raised-gun poses
   // during the warning so the visible line always starts at a aimed weapon.
   // windupDuration is set by combat.js per guard kind; fall back to the
   // shared default for callers (tests, pre-fire enemies) that never set it.
   const duration=e.windupDuration??(isBoss?.6:.48);
   state='aim';index=1+Math.floor(Math.max(0,duration-e.windup)*8)%2;
   height=isBoss?147:enemyDisplayHeight(e);
  }
 }else if(e.shotFlash>0){
  if(isBoss){state='fire';index=Math.min(3,Math.floor(Math.max(0,ENEMY_FLASH_TIME-e.shotFlash)*20+1e-8));height=146;}
  else{
   // Guard fire rows are tightly cropped in the source sheets and can look
   // truncated at gameplay scale. Keep the full raised-gun pose during the
   // flash while the projectile itself supplies the visible shot.
   state='aim';index=2;height=enemyDisplayHeight(e);
  }
 }
 else return null;
 const kind=isBoss?'boss':enemyKind(e);
 const frames=isBoss?BOSS_FRAMES:kind==='city'?CITY_FRAMES:kind==='sniper'?SNIPER_FRAMES:HEAVY_FRAMES;
 const frame=frames[state][index],[fx,fy,fw,fh]=frame;
 const [mx,my]=MUZZLES[kind][state][index];
 const facing=e.attackFacing??(e.aimX<e.x+e.w/2?-1:1);
 const scale=height/fh;
 return {state,index,frame,height,facing,muzzle:{
  x:e.x+e.w/2+facing*(mx-fx-fw/2)*scale,
  y:e.y+e.h+(my-fy-fh)*scale
 }};
}
export function enemyWeaponMuzzle(e,isBoss=false){
 const pose=enemyAttackPose(e,isBoss);
 return pose?pose.muzzle:fallbackEnemyMuzzle(e,0,isBoss);
}
export function fallbackEnemyMuzzle(e,time,isBoss=false){
 const facing=e.attackFacing??(e.aimX<e.x+e.w/2?-1:1);
 // Match the procedural renderers while images are loading or unavailable.
 return isBoss?{x:e.x+e.w/2+facing*67,y:e.y+e.h-37}
  :{x:e.x+e.w/2+facing*35,y:e.y+e.h-22.5};
}
