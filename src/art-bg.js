import {createArt as createCharacterArt} from './art.js?v=20260917-guards-3-base';

const STAGE_URL='./assets/backgrounds/stage1_rooftop.jpg';
const BOSS_BG_URL='./assets/backgrounds/stage1_boss.jpg';

function loadImage(url){
 const img=new Image();
 img.decoding='async';
 const state={img,ready:false,failed:false};
 img.addEventListener('load',()=>{state.ready=true;});
 img.addEventListener('error',()=>{state.failed=true;});
 img.src=url;
 return state;
}

const stageAsset=loadImage(STAGE_URL);
const bossBgAsset=loadImage(BOSS_BG_URL);
const clamp01=v=>Math.max(0,Math.min(1,v));
const smoothstep=(a,b,v)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};

function drawStageImage(ctx,asset,camera,alpha=1){
 if(!asset.ready)return false;
 const W=ctx.canvas.width||960;
 // The artwork is prepared at 1280x720. Drawing it at 720px high aligns the
 // illustrated rooftop deck closely with the real gameplay ground at y=440.
 const drawW=1280,drawH=720;
 const travel=Math.max(0,drawW-W);
 const progress=clamp01(camera/(6600-W));
 const offset=travel*progress;
 ctx.save();
 ctx.globalAlpha=alpha;
 ctx.drawImage(asset.img,-offset,0,drawW,drawH);
 ctx.restore();
 return true;
}

export function createArt(ctx){
 const base=createCharacterArt(ctx);
 const fallbackBackground=base.background;
 const fallbackScenery=base.scenery;

 function background(camera,time){
  if(!stageAsset.ready){fallbackBackground(camera,time);return;}
  const W=ctx.canvas.width||960,H=ctx.canvas.height||540;
  ctx.fillStyle='#071321';ctx.fillRect(0,0,W,H);
  drawStageImage(ctx,stageAsset,camera,1);

  // The final approach gradually shifts toward red emergency lighting.
  const bossMix=smoothstep(4550,5600,camera);
  if(bossMix>0&&bossBgAsset.ready)drawStageImage(ctx,bossBgAsset,camera,bossMix*.92);

  // Subtle cool veil separates the red/black characters from the detailed scene.
  const haze=ctx.createLinearGradient(0,210,0,540);
  haze.addColorStop(0,'rgba(110,145,172,0)');
  haze.addColorStop(.50,'rgba(118,151,174,.055)');
  haze.addColorStop(.78,'rgba(126,151,168,.09)');
  haze.addColorStop(1,'rgba(5,12,20,.18)');
  ctx.fillStyle=haze;ctx.fillRect(0,190,W,350);
 }

 function scenery(camera){
  // The painted rooftop already contains the industrial scenery. Drawing the old
  // procedural buildings on top would create duplicate silhouettes and visual noise.
  if(!stageAsset.ready)fallbackScenery(camera);
 }

 return {...base,background,scenery};
}
