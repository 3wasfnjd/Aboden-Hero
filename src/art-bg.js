import {createArt as createCharacterArt} from './art.js?v=20260919-chapter2-2';

const CITY_URL='./assets/backgrounds/stage1-portrait.png';
const WALKWAY_URL='./assets/backgrounds/stage1-walkway.png';
const FLOATING_PLATFORM_URL='./assets/ui/level/platform.png';
const CHECKPOINT_URL='./assets/ui/level/checkpoint.png';
const GOAL_URL='./assets/ui/level/goal.png';

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
const floatingPlatformAsset=loadImage(FLOATING_PLATFORM_URL);
const checkpointAsset=loadImage(CHECKPOINT_URL);
const goalAsset=loadImage(GOAL_URL);
const CHECKPOINT_DISPLAY_H=100;
const GOAL_DISPLAY_H=175;

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

function drawFloatingPlatform(ctx,s){
 if(!floatingPlatformAsset.ready)return false;
 const img=floatingPlatformAsset.img;
 const dw=s.w,dh=img.naturalHeight*(dw/img.naturalWidth);
 ctx.drawImage(img,s.x,s.y-14,dw,dh);
 return true;
}

function drawCheckpoint(ctx,cp,time){
 if(!checkpointAsset.ready)return false;
 const img=checkpointAsset.img,dh=CHECKPOINT_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
 ctx.save();
 if(!cp.active){ctx.filter='grayscale(.85) brightness(.65)';ctx.globalAlpha=.85;}
 else{ctx.globalAlpha=.92+Math.sin(time*3+cp.x)*.08;}
 ctx.drawImage(img,cp.x-dw/2,440-dh,dw,dh);
 ctx.restore();
 return true;
}

function drawGoal(ctx,g,time,locked){
 if(!goalAsset.ready)return false;
 const img=goalAsset.img,dh=GOAL_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
 const cx=g.x+g.w/2,bottom=g.y+g.h;
 ctx.save();
 if(locked){ctx.filter='grayscale(.8) brightness(.55)';}
 else{ctx.globalAlpha=.9+Math.sin(time*3)*.1;}
 ctx.drawImage(img,cx-dw/2,bottom-dh,dw,dh);
 ctx.restore();
 return true;
}

export function createArt(ctx){
 const base=createCharacterArt(ctx);

 function background(camera,time){
  drawCity(ctx);

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

 function scenery(){}

 function platform(s){
  if(s.ground){drawGroundWalkway(ctx,s);return;}
  drawFloatingPlatform(ctx,s);
 }

 function checkpoint(cp,time){drawCheckpoint(ctx,cp,time);}
 function goal(g,time,locked=false){drawGoal(ctx,g,time,locked);}

 return {...base,background,scenery,platform,checkpoint,goal};
}

