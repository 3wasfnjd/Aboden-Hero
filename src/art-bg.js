import {createArt as createCharacterArt} from './art.js?v=20260917-guards-3-base';

const FAR_URL='./assets/backgrounds/stage1-far.svg';
const INDUSTRIAL_URL='./assets/backgrounds/stage1-industrial.svg';

function loadImage(url){
 const img=new Image();
 img.decoding='async';
 const state={img,ready:false,failed:false};
 img.addEventListener('load',()=>{state.ready=true;});
 img.addEventListener('error',()=>{state.failed=true;});
 img.src=url;
 return state;
}

const farAsset=loadImage(FAR_URL);
const industrialAsset=loadImage(INDUSTRIAL_URL);

function drawLayer(ctx,asset,camera,factor,alpha=1){
 if(!asset.ready)return false;
 const W=ctx.canvas.width||960,H=ctx.canvas.height||540;
 const ratio=2400/1080;
 const drawH=H,drawW=drawH*ratio;
 const maxOffset=Math.max(0,drawW-W);
 const offset=Math.min(maxOffset,Math.max(0,camera*factor));
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
  if(!farAsset.ready){fallbackBackground(camera,time);return;}
  const W=ctx.canvas.width||960,H=ctx.canvas.height||540;
  ctx.fillStyle='#071426';ctx.fillRect(0,0,W,H);
  drawLayer(ctx,farAsset,camera,.018,1);

  // A quiet cool haze lowers background contrast behind the red/black characters.
  const haze=ctx.createLinearGradient(0,170,0,500);
  haze.addColorStop(0,'rgba(55,91,121,0)');
  haze.addColorStop(.58,'rgba(76,110,136,.10)');
  haze.addColorStop(1,'rgba(13,31,50,.13)');
  ctx.fillStyle=haze;ctx.fillRect(0,140,W,400);
 }

 function scenery(camera){
  if(!industrialAsset.ready){fallbackScenery(camera);return;}
  drawLayer(ctx,industrialAsset,camera,.04,.78);

  // Keep the gameplay plane visually separated from the illustrated background.
  const W=ctx.canvas.width||960;
  const band=ctx.createLinearGradient(0,290,0,470);
  band.addColorStop(0,'rgba(83,116,142,0)');
  band.addColorStop(.58,'rgba(101,130,151,.08)');
  band.addColorStop(1,'rgba(7,17,28,.12)');
  ctx.fillStyle=band;ctx.fillRect(0,285,W,190);
 }

 return {...base,background,scenery};
}
