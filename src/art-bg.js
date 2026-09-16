import {createArt as createCharacterArt} from './art.js?v=20260917-guards-3-base';

const CITY_URL='./assets/backgrounds/stage1-city.png';
const WALKWAY_URL='./assets/backgrounds/stage1-walkway.png';

function loadImage(url){
 const img=new Image();
 img.decoding='async';
 const state={img,ready:false,failed:false};
 img.addEventListener('load',()=>{state.ready=true;});
 img.addEventListener('error',()=>{state.failed=true;});
 img.src=url;
 return state;
}

const cityAsset=loadImage(CITY_URL);
const walkwayAsset=loadImage(WALKWAY_URL);

function drawCity(ctx){
 if(!cityAsset.ready)return false;
 const W=ctx.canvas.width||960,H=ctx.canvas.height||540;
 ctx.save();
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 // The city artwork is 16:9, exactly matching the game canvas ratio.
 // Keep it locked to the screen so the skyline stays fixed behind gameplay.
 ctx.drawImage(cityAsset.img,0,0,W,H);
 ctx.restore();
 return true;
}

function drawGroundWalkway(ctx,s){
 if(!walkwayAsset.ready)return false;
 const img=walkwayAsset.img;
 const sourceSurfaceY=img.naturalHeight*.235;
 const usableBelow=Math.max(1,img.naturalHeight-sourceSurfaceY);
 const scale=s.h/usableBelow;
 const tileW=img.naturalWidth*scale;
 const tileH=img.naturalHeight*scale;
 const drawY=s.y-sourceSurfaceY*scale;

 ctx.save();
 // Each physical ground section remains clipped to its real collision width,
 // while the railing is allowed to rise above y=440.
 ctx.beginPath();
 ctx.rect(s.x,drawY-2,s.w,tileH+4);
 ctx.clip();

 // Dark backing prevents tiny transparent seams between repeated PNG tiles.
 ctx.fillStyle='#111a27';
 ctx.fillRect(s.x,s.y,s.w,s.h+4);

 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 const step=Math.max(1,tileW-1);
 let start=Math.floor(s.x/step)*step;
 while(start>s.x)start-=step;
 for(let x=start;x<s.x+s.w+tileW;x+=step){
  ctx.drawImage(img,x,drawY,tileW,tileH);
 }
 ctx.restore();
 return true;
}

export function createArt(ctx){
 const base=createCharacterArt(ctx);
 const fallbackBackground=base.background;
 const fallbackScenery=base.scenery;
 const fallbackPlatform=base.platform;

 function background(camera,time){
  if(!drawCity(ctx)){fallbackBackground(camera,time);return;}

  // Light separation only around the gameplay plane. The city remains crisp,
  // but the red/black sprites keep readable silhouettes.
  const W=ctx.canvas.width||960,H=ctx.canvas.height||540;
  const haze=ctx.createLinearGradient(0,300,0,H);
  haze.addColorStop(0,'rgba(92,123,151,0)');
  haze.addColorStop(.48,'rgba(108,139,164,.035)');
  haze.addColorStop(.74,'rgba(9,19,31,.07)');
  haze.addColorStop(1,'rgba(4,10,18,.18)');
  ctx.fillStyle=haze;
  ctx.fillRect(0,280,W,H-280);
 }

 function scenery(camera){
  // The city is now a dedicated fixed backdrop. Do not draw the old procedural
  // rooftop scenery over it.
  if(!cityAsset.ready)fallbackScenery(camera);
 }

 function platform(s){
  if(s.ground&&drawGroundWalkway(ctx,s))return;
  fallbackPlatform(s);
 }

 return {...base,background,scenery,platform};
}
