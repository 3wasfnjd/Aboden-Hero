import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {createPuzzleAudio} from '../core/puzzle-audio.js';
import {matchingAssets} from './assets.js';
import {MATCH_PORTS,isMatchingSolved,matchingColor,getPort} from './matching-logic.js';

const PORT_RECTS=Object.freeze({
  'left-blue':Object.freeze([.145,.215,.205,.165]),
  'left-purple':Object.freeze([.145,.410,.205,.165]),
  'left-orange':Object.freeze([.145,.610,.205,.165]),
  'right-blue':Object.freeze([.650,.215,.205,.165]),
  'right-orange':Object.freeze([.650,.410,.205,.165]),
  'right-purple':Object.freeze([.650,.610,.205,.165])
});

// Calibrated against the supplied solved reference. Values are in normalized
// board coordinates and only affect display; the source PNG files are untouched.
const CABLE_RECTS=Object.freeze({
  blue:Object.freeze([.292,.146,.402,.301]),
  purple:Object.freeze([.279,.426,.416,.327]),
  orange:Object.freeze([.238,.405,.455,.376])
});

export class MatchingPuzzle extends PuzzleCore {
  constructor({root,assets=matchingAssets,debugHitAreas=false,audio=true,audioOptions={}}={}){
    super({id:'matching',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
    this.selectedId=null;
    this.connectedColors=new Set();
    this.portButtons=new Map();
    this.cableImages=new Map();
    this.statusEl=null;
    this.resetButton=null;
    this.audioButton=null;
    this.audioEngine=audio?createPuzzleAudio(audioOptions):null;
    this.audioUnlockHandler=null;
    this.errorTimer=null;
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز مطابقة التوصيلات',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    if(!stage)return this;

    this.root.classList.add('matching-stage');
    this.buildCables();
    this.buildPorts();
    this.buildControls();

    if(this.audioEngine){
      this.audioUnlockHandler=()=>{this.audioEngine.unlock().then(()=>this.updateAudioButton());};
      this.root.addEventListener('pointerdown',this.audioUnlockHandler,{once:true,passive:true});
    }

    this.render();
    return this;
  }

  buildCables(){
    const {naturalWidth:width,naturalHeight:height}=this.stage;
    const layer=document.createElement('div');
    layer.className='matching-cable-layer';
    this.stage.scene.insertBefore(layer,this.stage.hitLayer);

    for(const color of ['blue','purple','orange']){
      const rect=CABLE_RECTS[color];
      const image=document.createElement('img');
      image.className='matching-cable';
      image.dataset.color=color;
      image.src=this.assets.cables[color];
      image.alt='';
      image.draggable=false;
      image.decoding='async';
      Object.assign(image.style,{
        left:`${rect[0]*width}px`,
        top:`${rect[1]*height}px`,
        width:`${rect[2]*width}px`,
        height:`${rect[3]*height}px`
      });
      layer.append(image);
      this.cableImages.set(color,image);
    }
  }

  buildPorts(){
    const {naturalWidth:width,naturalHeight:height}=this.stage;
    for(const port of MATCH_PORTS){
      const [x,y,w,h]=PORT_RECTS[port.id];
      const button=document.createElement('button');
      button.type='button';
      button.className='matching-port';
      button.dataset.port=port.id;
      button.dataset.side=port.side;
      button.dataset.color=port.color;
      button.ariaLabel=`موصل ${port.color} — ${port.side==='left'?'يسار':'يمين'}`;
      Object.assign(button.style,{
        left:`${x*width}px`,
        top:`${y*height}px`,
        width:`${w*width}px`,
        height:`${h*height}px`
      });
      button.addEventListener('click',()=>this.pressPort(port.id));
      this.stage.hitLayer.append(button);
      this.portButtons.set(port.id,button);
    }
  }

  buildControls(){
    this.statusEl=document.createElement('div');
    this.statusEl.className='matching-status';
    this.stage.scene.append(this.statusEl);

    if(this.audioEngine){
      this.audioButton=document.createElement('button');
      this.audioButton.type='button';
      this.audioButton.className='matching-audio-toggle';
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
    this.resetButton.className='matching-reset';
    this.resetButton.textContent='RESET';
    this.resetButton.addEventListener('click',()=>this.reset());
    this.stage.scene.append(this.resetButton);
  }

  playSelect(){
    if(!this.audioEngine)return;
    this.audioEngine.unlock().then(ok=>{
      if(ok)this.audioEngine.tone({frequency:330,endFrequency:410,duration:.07,gain:.12,type:'triangle'});
    });
  }

  playCorrect(){
    if(!this.audioEngine)return;
    this.audioEngine.unlock().then(ok=>{
      if(ok)this.audioEngine.tone({frequency:520,endFrequency:760,duration:.16,gain:.14,type:'sine'});
    });
  }

  playWrong(){
    if(!this.audioEngine)return;
    this.audioEngine.unlock().then(ok=>{
      if(ok)this.audioEngine.tone({frequency:155,endFrequency:95,duration:.17,gain:.12,type:'sawtooth'});
    });
  }

  pressPort(id){
    if(!this.started||this.solved)return false;
    const port=getPort(id);
    if(!port||this.connectedColors.has(port.color))return false;

    if(!this.selectedId){
      this.selectedId=id;
      this.playSelect();
      this.render();
      return true;
    }

    if(this.selectedId===id){
      this.selectedId=null;
      this.render();
      return true;
    }

    const selected=getPort(this.selectedId);
    if(selected?.side===port.side){
      this.selectedId=id;
      this.playSelect();
      this.render();
      return true;
    }

    const color=matchingColor(this.selectedId,id);
    if(color){
      this.connectedColors.add(color);
      this.selectedId=null;
      this.playCorrect();
      this.render();
      if(isMatchingSolved(this.connectedColors))this.finish();
      return true;
    }

    this.selectedId=null;
    this.playWrong();
    this.flashError();
    this.render();
    return false;
  }

  flashError(){
    clearTimeout(this.errorTimer);
    this.root.classList.remove('matching-error');
    void this.root.offsetWidth;
    this.root.classList.add('matching-error');
    this.errorTimer=setTimeout(()=>this.root.classList.remove('matching-error'),240);
  }

  render(){
    for(const [id,button] of this.portButtons){
      const port=getPort(id);
      button.classList.toggle('selected',id===this.selectedId);
      button.classList.toggle('connected',this.connectedColors.has(port.color));
      button.disabled=this.solved||this.connectedColors.has(port.color);
    }

    for(const [color,image] of this.cableImages){
      image.classList.toggle('connected',this.connectedColors.has(color));
    }

    if(this.statusEl){
      const count=this.connectedColors.size;
      this.statusEl.textContent=this.solved?'SYSTEM ONLINE':`${count} / 3 CONNECTED`;
      this.statusEl.classList.toggle('online',this.solved);
    }
  }

  finish(){
    if(this.solved)return false;
    this.audioEngine?.playSuccess();
    this.solve({connections:[...this.connectedColors]});
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
    this.selectedId=null;
    this.connectedColors.clear();
    this.started=true;
    this.root.classList.remove('matching-error');
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
    this.root.classList.remove('matching-stage','matching-error');
    super.destroy();
  }
}

export async function createMatchingPuzzle(options){
  return new MatchingPuzzle(options).mount();
}
