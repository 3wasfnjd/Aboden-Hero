import {createArt as createCharacterArt} from './art.js?v=20260919-fullsheets-1';

const CITY_URL='./assets/backgrounds/stage1-portrait.png';
const CITY2_URL='./assets/backgrounds/stage2-rooftop.jpeg';
const WALKWAY_URL='./assets/backgrounds/stage1-walkway.png';
const FLOATING_PLATFORM_URL='./assets/ui/level/platform.png';
const FLOATING_PLATFORM2_URL='./assets/ui/level/platform2.png';
const CHECKPOINT_URL='./assets/ui/level/checkpoint.png';
const GOAL_URL='./assets/ui/level/goal.png';
const GOAL2_URL='./assets/ui/level/goal2.png';

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
const city2Asset=loadImage(CITY2_URL);
const walkwayAsset=loadImage(WALKWAY_URL);
const floatingPlatformAsset=loadImage(FLOATING_PLATFORM_URL);
const floatingPlatform2Asset=loadImage(FLOATING_PLATFORM2_URL);
const checkpointAsset=loadImage(CHECKPOINT_URL);
const goalAsset=loadImage(GOAL_URL);
const goal2Asset=loadImage(GOAL2_URL);
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

// Chapter 2's source art is a wide landscape rooftop shot, the opposite shape
// of chapter 1's tall portrait skyline. Cover-fit on height and center-crop
// the width instead, so the storm and skyline fill the tall phone canvas
// rather than shrinking to a thin strip anchored at the bottom.
function drawCity2(ctx){
 if(!city2Asset.ready)return false;
 const img=city2Asset.img,W=ctx.canvas.width||960,H=ctx.canvas.height||540;
 ctx.save();
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 const scale=H/img.naturalHeight;
 const srcW=Math.min(img.naturalWidth,W/scale);
 const sx=(img.naturalWidth-srcW)/2;
 ctx.drawImage(img,sx,0,srcW,img.naturalHeight,0,0,W,H);
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
 const asset=s.chapter===2?floatingPlatform2Asset:floatingPlatformAsset;
 if(!asset.ready)return false;
 const img=asset.img;
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

function drawGate(ctx,s,time){
 ctx.save();
 const stripe=14,pulse=.85+Math.sin(time*3)*.15;
 ctx.beginPath();ctx.rect(s.x,s.y,s.w,s.h);ctx.clip();
 ctx.fillStyle='#241012';ctx.fillRect(s.x,s.y,s.w,s.h);
 ctx.fillStyle='#c0242c';
 for(let x=-s.h;x<s.w+s.h;x+=stripe*2)ctx.fillRect(s.x+x,s.y,stripe,s.h);
 ctx.restore();
 ctx.save();ctx.strokeStyle='#5c1418';ctx.lineWidth=3;ctx.strokeRect(s.x+1.5,s.y+1.5,s.w-3,s.h-3);
 ctx.globalAlpha=pulse;ctx.fillStyle='#ff5b5b';ctx.beginPath();ctx.arc(s.x+s.w/2,s.y+22,5,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawTerminal(ctx,term,time){
 const solved=term.solved,ink=solved?'#0ecbfd':'#ff4b51',glow=solved?'#7ff0e0':'#ff8c85';
 const cx=term.x+term.w/2,top=term.y;
 ctx.save();
 ctx.fillStyle='#182430';ctx.fillRect(term.x-4,top-6,term.w+8,term.h+6);
 ctx.strokeStyle='#4a6a86';ctx.lineWidth=2;ctx.strokeRect(term.x-4,top-6,term.w+8,term.h+6);
 const flicker=solved?1:.65+Math.sin(time*9)*.25;
 ctx.globalAlpha=flicker;ctx.fillStyle=ink;ctx.fillRect(term.x+3,top,term.w-6,14);
 ctx.globalAlpha=1;
 ctx.shadowColor=glow;ctx.shadowBlur=solved?10:5;
 ctx.fillStyle=ink;
 ctx.beginPath();ctx.arc(cx,top+26,4,0,Math.PI*2);ctx.fill();
 ctx.font='bold 9px Tahoma';ctx.textAlign='center';ctx.fillText(solved?'ON':'OFF',cx,top+42);
 ctx.restore();
}
function drawElevator(ctx,el,time,ready){
 const cx=el.x+el.w/2,ink=ready?'#0ecbfd':'#93a8bb';
 ctx.save();
 ctx.fillStyle='#0d1620';ctx.fillRect(el.x,el.y,el.w,el.h);
 ctx.strokeStyle='#4a6a86';ctx.lineWidth=3;ctx.strokeRect(el.x+2,el.y+2,el.w-4,el.h-4);
 ctx.strokeStyle='#26364a';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(cx,el.y+4);ctx.lineTo(cx,el.y+el.h-4);ctx.stroke();
 const glow=ready?.7+Math.sin(time*4)*.3:.4;
 ctx.globalAlpha=glow;ctx.fillStyle=ink;ctx.beginPath();ctx.arc(el.x+el.w/2,el.y+14,4,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawGoal(ctx,g,time,locked){
 const asset=g.chapter===2?goal2Asset:goalAsset;
 if(!asset.ready)return false;
 const img=asset.img,dh=GOAL_DISPLAY_H,dw=dh*(img.naturalWidth/img.naturalHeight);
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

 function background(camera,time,chapter=1){
  if(chapter===2)drawCity2(ctx);
  else drawCity(ctx);

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
 function gate(s,time){drawGate(ctx,s,time);}
 function terminal(term,time){drawTerminal(ctx,term,time);}
 function elevator(el,time,ready){drawElevator(ctx,el,time,ready);}

 return {...base,background,scenery,platform,checkpoint,goal,gate,terminal,elevator};
}

