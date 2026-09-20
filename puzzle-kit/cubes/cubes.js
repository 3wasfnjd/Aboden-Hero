import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {createPuzzleAudio} from '../core/puzzle-audio.js';
import {cubeAssets} from './assets.js';
import {
  CUBE_ROUTE,CUBE_INITIAL,CUBE_DISTRACTORS,cubeType,routeProgress,isCubesSolved,swapCubeSlots
} from './cubes-logic.js';

const SLOT_RECTS=Object.freeze([
  [.198,.215,.198,.196],[.401,.215,.198,.196],[.604,.215,.198,.196],
  [.198,.416,.198,.196],[.401,.416,.198,.196],[.604,.416,.198,.196],
  [.198,.617,.198,.196],[.401,.617,.198,.196],[.604,.617,.198,.196]
]);

const SUCCESS_LIGHTS=Object.freeze([
  Object.freeze({id:'top',x:.50,y:.087,width:.222,height:.017}),
  Object.freeze({id:'upper-left',x:.236,y:.145,width:.046,height:.016}),
  Object.freeze({id:'upper-right',x:.764,y:.145,width:.046,height:.016}),
  Object.freeze({id:'mid-left',x:.137,y:.422,width:.017,height:.118}),
  Object.freeze({id:'mid-right',x:.862,y:.422,width:.017,height:.118}),
  Object.freeze({id:'bottom-left',x:.273,y:.827,width:.044,height:.015}),
  Object.freeze({id:'bottom-right',x:.727,y:.827,width:.044,height:.015})
]);

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`Failed to load cube asset: ${src}`));
    image.src=src;
  });
}

function isBorderWhite(data,pixelIndex){
  const offset=pixelIndex*4;
  const r=data[offset],g=data[offset+1],b=data[offset+2];
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  return min>=236&&(max-min)<=24;
}

async function removeConnectedWhiteBackground(src){
  const image=await loadImage(src);
  const width=image.naturalWidth,height=image.naturalHeight;
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,width,height);
  const data=pixels.data;
  const total=width*height;
  const seen=new Uint8Array(total);
  const stack=new Int32Array(total);
  let top=0;

  const push=index=>{
    if(index<0||index>=total||seen[index]||!isBorderWhite(data,index))return;
    seen[index]=1;stack[top++]=index;
  };

  for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
  for(let y=0;y<height;y++){push(y*width);push(y*width+width-1);}

  while(top){
    const index=stack[--top];
    data[index*4+3]=0;
    const x=index%width,y=(index/width)|0;
    if(x>0)push(index-1);
    if(x<width-1)push(index+1);
    if(y>0)push(index-width);
    if(y<height-1)push(index+width);
  }

  let minX=width,minY=height,maxX=-1,maxY=-1;
  for(let y=0;y<height;y++){
    let index=y*width;
    for(let x=0;x<width;x++,index++){
      if(data[index*4+3]===0)continue;
      if(x<minX)minX=x;if(x>maxX)maxX=x;
      if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
  }

  if(maxX<minX||maxY<minY)return {src,width,height,revoke:null};

  const margin=8;
  minX=Math.max(0,minX-margin);minY=Math.max(0,minY-margin);
  maxX=Math.min(width-1,maxX+margin);maxY=Math.min(height-1,maxY+margin);
  context.putImageData(pixels,0,0);

  const crop=document.createElement('canvas');
  crop.width=maxX-minX+1;crop.height=maxY-minY+1;
  crop.getContext('2d').drawImage(canvas,minX,minY,crop.width,crop.height,0,0,crop.width,crop.height);

  const blob=await new Promise(resolve=>crop.toBlob(resolve,'image/png'));
  if(!blob)return {src:crop.toDataURL('image/png'),width:crop.width,height:crop.height,revoke:null};
  const url=URL.createObjectURL(blob);
  return {src:url,width:crop.width,height:crop.height,revoke:()=>URL.revokeObjectURL(url)};
}

export class CubesPuzzle extends PuzzleCore {
  constructor({root,assets=cubeAssets,debugHitAreas=false,audio=true,audioOptions={}}={}){
    super({id:'cubes',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
    this.order=[...CUBE_INITIAL];
    this.selectedSlot=null;
    this.slotButtons=[];
    this.pieceSources=new Map();
    this.pieceRevokers=[];
    this.solutionImage=null;
    this.statusEl=null;
    this.resetButton=null;
    this.loadingEl=null;
    this.successLights=[];
    this.audioEngine=audio?createPuzzleAudio(audioOptions):null;
    this.audioButton=null;
    this.audioUnlockHandler=null;
    this.errorTimer=null;
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز ترتيب المكعبات',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    if(!stage)return this;

    this.root.classList.add('cubes-stage');
    this.buildLoading();
    this.buildSolutionOverlay();
    this.buildSlots();
    this.buildSuccessLights();
    this.buildControls();

    try{
      await this.preparePieceSources();
    }finally{
      if(this.loadingEl)this.loadingEl.hidden=true;
    }

    if(this.audioEngine){
      this.audioUnlockHandler=()=>{this.audioEngine.unlock().then(()=>this.updateAudioButton());};
      this.root.addEventListener('pointerdown',this.audioUnlockHandler,{once:true,passive:true});
    }

    this.render();
    return this;
  }

  buildLoading(){
    this.loadingEl=document.createElement('div');
    this.loadingEl.className='cubes-loading';
    this.loadingEl.textContent='PREPARING PIECES…';
    this.stage.scene.append(this.loadingEl);
  }

  buildSolutionOverlay(){
    this.solutionImage=document.createElement('img');
    this.solutionImage.className='cubes-solution-overlay';
    this.solutionImage.src=this.assets.solved;
    this.solutionImage.alt='';
    this.solutionImage.draggable=false;
    this.solutionImage.decoding='async';
    this.solutionImage.width=this.stage.naturalWidth;
    this.solutionImage.height=this.stage.naturalHeight;
    Object.assign(this.solutionImage.style,{
      left:'0px',
      top:'0px',
      width:`${this.stage.naturalWidth}px`,
      height:`${this.stage.naturalHeight}px`
    });
    this.stage.scene.insertBefore(this.solutionImage,this.stage.hitLayer);
  }

  buildSlots(){
    const {naturalWidth:width,naturalHeight:height}=this.stage;
    const layer=document.createElement('div');
    layer.className='cubes-piece-layer';
    this.stage.scene.insertBefore(layer,this.stage.hitLayer);

    this.slotButtons=SLOT_RECTS.map((rect,index)=>{
      const [x,y,w,h]=rect;
      const button=document.createElement('button');
      button.type='button';
      button.className='cubes-slot';
      button.dataset.slot=String(index);
      button.ariaLabel=`خانة ${index+1}`;
      Object.assign(button.style,{
        left:`${x*width}px`,top:`${y*height}px`,
        width:`${w*width}px`,height:`${h*height}px`
      });
      button.addEventListener('click',()=>this.pressSlot(index));
      layer.append(button);
      return button;
    });
  }

  buildSuccessLights(){
    const {naturalWidth:width,naturalHeight:height}=this.stage;
    this.successLights=SUCCESS_LIGHTS.map(light=>{
      const el=document.createElement('span');
      el.className=`cubes-success-light cubes-success-light--${light.id}`;
      el.ariaHidden='true';
      Object.assign(el.style,{
        left:`${light.x*width}px`,top:`${light.y*height}px`,
        width:`${light.width*width}px`,height:`${light.height*height}px`
      });
      this.stage.scene.append(el);
      return el;
    });
  }

  buildControls(){
    this.statusEl=document.createElement('div');
    this.statusEl.className='cubes-status';
    this.stage.scene.append(this.statusEl);

    if(this.audioEngine){
      this.audioButton=document.createElement('button');
      this.audioButton.type='button';
      this.audioButton.className='cubes-audio-toggle';
      this.audioButton.addEventListener('click',async event=>{
        event.stopPropagation();
        await this.audioEngine.unlock();
        this.audioEngine.toggleMuted();
        this.updateAudioButton();
      });
      this.stage.scene.append(this.audioButton);
      this.updateAudioButton();
    }

    this.resetButton=document.createElement('button');
    this.resetButton.type='button';
    this.resetButton.className='cubes-reset';
    this.resetButton.textContent='RESET';
    this.resetButton.addEventListener('click',()=>this.reset());
    this.stage.scene.append(this.resetButton);
  }

  async preparePieceSources(){
    const types=['start','right','down','straight','junction','lock','goal'];
    for(const type of types){
      const processed=await removeConnectedWhiteBackground(this.assets.pieces[type]);
      this.pieceSources.set(type,processed.src);
      if(processed.revoke)this.pieceRevokers.push(processed.revoke);
    }
  }

  playSelect(){
    if(!this.audioEngine)return;
    this.audioEngine.unlock().then(ok=>{
      if(ok)this.audioEngine.tone({frequency:300,endFrequency:380,duration:.07,gain:.11,type:'triangle'});
    });
  }

  playSwap(){
    if(!this.audioEngine)return;
    this.audioEngine.unlock().then(ok=>{
      if(!ok)return;
      this.audioEngine.tone({frequency:390,endFrequency:540,duration:.10,gain:.13,type:'triangle'});
      this.audioEngine.tone({frequency:590,endFrequency:720,duration:.08,gain:.08,type:'sine',when:.055});
    });
  }

  pressSlot(index){
    if(!this.started||this.solved||!Number.isInteger(index))return false;

    if(this.selectedSlot===null){
      if(this.order[index]===null)return false;
      this.selectedSlot=index;
      this.playSelect();
      this.render();
      return true;
    }

    if(this.selectedSlot===index){
      this.selectedSlot=null;
      this.render();
      return true;
    }

    const next=swapCubeSlots(this.order,this.selectedSlot,index);
    if(!next){
      this.flashError();
      return false;
    }

    this.order=next;
    this.selectedSlot=null;
    this.playSwap();
    this.render();

    if(isCubesSolved(this.order))this.finish();
    return true;
  }

  flashError(){
    clearTimeout(this.errorTimer);
    this.root.classList.remove('cubes-error');
    void this.root.offsetWidth;
    this.root.classList.add('cubes-error');
    this.errorTimer=setTimeout(()=>this.root.classList.remove('cubes-error'),240);
  }

  render(){
    const required=new Map(CUBE_ROUTE.map(step=>[step.slot,step.type]));

    this.slotButtons.forEach((button,index)=>{
      const id=this.order[index];
      const type=cubeType(id);
      button.replaceChildren();
      button.classList.toggle('selected',this.selectedSlot===index);
      button.classList.toggle('route-correct',required.get(index)===type);
      button.classList.toggle('distractor',CUBE_DISTRACTORS.includes(type));
      button.disabled=this.solved;

      if(id){
        const image=document.createElement('img');
        image.className='cubes-piece';
        image.src=this.pieceSources.get(type)||this.assets.pieces[type];
        image.alt='';
        image.draggable=false;
        button.append(image);
      }
    });

    const progress=routeProgress(this.order);
    if(this.statusEl){
      this.statusEl.textContent=this.solved?'SYSTEM ONLINE':`${progress} / ${CUBE_ROUTE.length} ROUTE`;
      this.statusEl.classList.toggle('online',this.solved);
    }
    this.root.classList.toggle('cubes-complete',this.solved);
  }

  finish(){
    if(this.solved)return false;
    this.audioEngine?.playSuccess();
    this.solve({order:[...this.order]});
    this.render();
    return true;
  }

  updateAudioButton(){
    if(!this.audioButton||!this.audioEngine)return;
    const muted=this.audioEngine.muted;
    this.audioButton.textContent=muted?'🔇':'🔊';
    this.audioButton.title=muted?'تشغيل الصوت':'كتم الصوت';
    this.audioButton.ariaLabel=this.audioButton.title;
    this.audioButton.setAttribute('aria-pressed',String(muted));
    this.audioButton.classList.toggle('muted',muted);
  }

  reset(){
    super.reset();
    this.order=[...CUBE_INITIAL];
    this.selectedSlot=null;
    this.started=true;
    this.root.classList.remove('cubes-error','cubes-complete');
    this.render();
    return true;
  }

  destroy(){
    clearTimeout(this.errorTimer);
    if(this.audioUnlockHandler){
      this.root.removeEventListener('pointerdown',this.audioUnlockHandler);
      this.audioUnlockHandler=null;
    }
    this.audioEngine?.destroy();
    for(const revoke of this.pieceRevokers)revoke();
    this.pieceRevokers=[];
    this.root.classList.remove('cubes-stage','cubes-error','cubes-complete');
    super.destroy();
  }
}

export async function createCubesPuzzle(options){
  return new CubesPuzzle(options).mount();
}
