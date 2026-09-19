import {PUZZLE_EVENTS} from './puzzle-core.js';

export class AssetStage {
  constructor({root,fit='contain',allowUpscale=false,debugHitAreas=false}={}){
    if(!root)throw new Error('AssetStage requires a root element');
    this.root=root;
    this.fit=fit;
    this.allowUpscale=allowUpscale;
    this.debugHitAreas=debugHitAreas;
    this.naturalWidth=0;
    this.naturalHeight=0;
    this.scale=1;
    this.resizeObserver=null;

    this.viewport=document.createElement('div');
    this.viewport.className='puzzle-asset-viewport';

    this.scene=document.createElement('div');
    this.scene.className='puzzle-asset-scene';

    this.image=document.createElement('img');
    this.image.className='puzzle-asset-image';
    this.image.alt='';
    this.image.draggable=false;
    this.image.decoding='async';

    this.hitLayer=document.createElement('div');
    this.hitLayer.className='puzzle-hit-layer';

    this.scene.append(this.image,this.hitLayer);
    this.viewport.append(this.scene);
    this.root.replaceChildren(this.viewport);

    this.resizeObserver=new ResizeObserver(()=>this.layout());
    this.resizeObserver.observe(this.root);
  }

  async load(src,{alt=''}={}){
    if(!src)throw new Error('AssetStage.load requires an image source');
    this.image.alt=alt;
    await new Promise((resolve,reject)=>{
      this.image.onload=()=>resolve();
      this.image.onerror=()=>reject(new Error(`Failed to load puzzle asset: ${src}`));
      this.image.src=src;
    });
    this.naturalWidth=this.image.naturalWidth;
    this.naturalHeight=this.image.naturalHeight;
    this.image.width=this.naturalWidth;
    this.image.height=this.naturalHeight;
    this.scene.style.width=`${this.naturalWidth}px`;
    this.scene.style.height=`${this.naturalHeight}px`;
    this.layout();
    return {width:this.naturalWidth,height:this.naturalHeight,src};
  }

  layout(){
    if(!this.naturalWidth||!this.naturalHeight)return;
    const vw=this.root.clientWidth||this.naturalWidth;
    const vh=this.root.clientHeight||this.naturalHeight;
    let scale=this.fit==='width'?vw/this.naturalWidth:Math.min(vw/this.naturalWidth,vh/this.naturalHeight);
    if(!this.allowUpscale)scale=Math.min(scale,1);
    this.scale=Math.max(scale,.01);
    this.scene.style.transform=`scale(${this.scale})`;
    this.viewport.style.width=`${this.naturalWidth*this.scale}px`;
    this.viewport.style.height=`${this.naturalHeight*this.scale}px`;
  }

  clearHitAreas(){
    this.hitLayer.replaceChildren();
  }

  addHitArea({id,x,y,width,height,onPress,disabled=false,label=''}) {
    const button=document.createElement('button');
    button.type='button';
    button.className='puzzle-hit-area';
    if(this.debugHitAreas)button.classList.add('debug');
    button.dataset.hitId=id;
    button.ariaLabel=label||id;
    button.disabled=disabled;
    Object.assign(button.style,{
      left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`
    });
    if(onPress)button.addEventListener('click',event=>onPress({id,event,button}));
    this.hitLayer.append(button);
    return button;
  }

  pointToAsset(clientX,clientY){
    const rect=this.scene.getBoundingClientRect();
    return {
      x:(clientX-rect.left)/this.scale,
      y:(clientY-rect.top)/this.scale
    };
  }

  destroy(){
    this.resizeObserver?.disconnect();
    this.root.replaceChildren();
  }
}

export function forwardAssetError(puzzle,error){
  puzzle.emit(PUZZLE_EVENTS.ERROR,{message:error.message,error});
}
