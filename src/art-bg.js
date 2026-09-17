import {createArt as createCharacterArt} from './art.js?v=20260917-guards-1';

const CITY_URL='./assets/backgrounds/stage1-portrait.png';
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
 const img=cityAsset.img,W=ctx.canvas.width||960,H=ctx.canvas.height||540;
 ctx.save();
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 // The artwork is natively ~9:16, near enough to the canvas that a plain cover-fit
 // leaves the moon and skyline sitting right at the very top of the canvas. Real
 // phones display this canvas through object-fit:cover too, and when the browser
 // toolbar is visible that second crop comes from the top (see index.html) to keep
 // the ground/hero safe — which was cutting the moon off. Trim the least useful
 // bottom slice of the source (closest foreground water) and anchor the rest to
 // the canvas bottom instead, so the skyline sits lower with real headroom above
 // it; fill that headroom with more of the same night sky instead of a hard edge.
 const KEEP=.78;
 const cropH=img.naturalHeight*KEEP;
 const scale=W/img.naturalWidth;
 const dh=cropH*scale,dy=H-dh;
 if(dy>0){
  const sky=ctx.createLinearGradient(0,0,0,dy);
  sky.addColorStop(0,'#0a1120');sky.addColorStop(1,'#111d30');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,dy);
  for(let i=0;i<Math.round(dy/14);i++){
   ctx.fillStyle=i%5?'#c7d2df55':'#e9eef3aa';
   ctx.fillRect((i*151+41)%W,(i*89+13)%dy,1.6,1.6);
  }
 }
 ctx.drawImage(img,0,0,img.naturalWidth,cropH,0,dy,W,dh);
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
  const W=ctx.canvas.width||960,H=ctx.canvas.height||540,shift=H-540;
  const haze=ctx.createLinearGradient(0,shift+300,0,shift+540);
  haze.addColorStop(0,'rgba(92,123,151,0)');
  haze.addColorStop(.48,'rgba(108,139,164,.035)');
  haze.addColorStop(.74,'rgba(9,19,31,.07)');
  haze.addColorStop(1,'rgba(4,10,18,.18)');
  ctx.fillStyle=haze;
  ctx.fillRect(0,shift+280,W,260);
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

