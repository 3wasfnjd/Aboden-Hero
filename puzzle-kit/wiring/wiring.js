import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {wiringAssets} from './assets.js';
import {
  WIRING_LAYOUT,INITIAL_ROTATIONS,connectedFromStart,isWiringSolved,normalizeRotation
} from './wiring-logic.js';

const PIECE_DISPLAY_TRANSFORM=Object.freeze({
  // The straight source is much taller/narrower (229×477) than the other
  // pieces. Normalize its connector thickness without shortening it too much.
  straight:Object.freeze({x:.72,y:.89}),
  elbow:Object.freeze({x:1,y:1}),
  cross:Object.freeze({x:1,y:1}),
  tee:Object.freeze({x:1,y:1})
});

const SLOT_RECTS=Object.freeze([
  [0.198,0.226,0.144,0.157],[0.347,0.226,0.144,0.157],[0.497,0.226,0.144,0.157],[0.646,0.226,0.144,0.157],
  [0.198,0.397,0.144,0.157],[0.347,0.397,0.144,0.157],[0.497,0.397,0.144,0.157],[0.646,0.397,0.144,0.157],
  [0.198,0.570,0.144,0.157],[0.347,0.570,0.144,0.157],[0.497,0.570,0.144,0.157],[0.646,0.570,0.144,0.157]
]);

export class WiringPuzzle extends PuzzleCore {
  constructor({root,assets=wiringAssets,debugHitAreas=false}={}){
    super({id:'wiring',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
    this.pieceLayer=null;
    this.statusEl=null;
    this.resetButton=null;
    this.rotations=[...INITIAL_ROTATIONS];
    this.pieceButtons=[];
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز التوصيلات الكهربائية',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    if(!stage)return this;

    this.root.classList.add('wiring-stage');
    this.buildPieces();
    this.render();
    return this;
  }

  buildPieces(){
    const width=this.stage.naturalWidth,height=this.stage.naturalHeight;

    this.pieceLayer=document.createElement('div');
    this.pieceLayer.className='wiring-piece-layer';
    this.stage.scene.insertBefore(this.pieceLayer,this.stage.hitLayer);

    this.pieceButtons=WIRING_LAYOUT.map((tile,index)=>{
      const [rx,ry,rw,rh]=SLOT_RECTS[index];
      const button=document.createElement('button');
      button.type='button';
      button.className='wiring-piece';
      button.dataset.index=String(index);
      button.dataset.type=tile.type;
      button.ariaLabel=`قطعة توصيل ${index+1} — اضغط للتدوير`;
      Object.assign(button.style,{
        left:`${rx*width}px`,
        top:`${ry*height}px`,
        width:`${rw*width}px`,
        height:`${rh*height}px`
      });

      const image=document.createElement('img');
      image.src=this.assets.pieces[tile.type];
      image.alt='';
      image.draggable=false;
      image.decoding='async';
      button.append(image);
      button.addEventListener('click',()=>this.rotate(index));
      this.pieceLayer.append(button);
      return button;
    });

    this.statusEl=document.createElement('div');
    this.statusEl.className='wiring-status';
    this.statusEl.textContent='SYSTEM OFFLINE';
    this.stage.scene.append(this.statusEl);

    this.resetButton=document.createElement('button');
    this.resetButton.type='button';
    this.resetButton.className='wiring-reset';
    this.resetButton.textContent='RESET';
    this.resetButton.addEventListener('click',()=>this.reset());
    this.stage.scene.append(this.resetButton);
  }

  rotate(index){
    if(!this.started||this.solved||!this.pieceButtons[index])return false;
    this.rotations[index]=normalizeRotation(this.rotations[index]+1);
    this.render();

    if(isWiringSolved(WIRING_LAYOUT,this.rotations)){
      this.finish();
    }
    return true;
  }

  render(){
    if(!this.stage)return;
    const powered=connectedFromStart(WIRING_LAYOUT,this.rotations);

    this.pieceButtons.forEach((button,index)=>{
      const rotation=normalizeRotation(this.rotations[index]);
      const image=button.querySelector('img');
      const tile=WIRING_LAYOUT[index];
      const display=PIECE_DISPLAY_TRANSFORM[tile.type]??{x:1,y:1};
      image.style.transform=`rotate(${rotation*90}deg) scaleX(${display.x}) scaleY(${display.y})`;
      button.classList.toggle('powered',powered.has(index));
      button.classList.toggle('solved',this.solved&&powered.has(index));
      button.disabled=this.solved;
    });

    if(this.statusEl){
      this.statusEl.textContent=this.solved?'SYSTEM ONLINE':'SYSTEM OFFLINE';
      this.statusEl.classList.toggle('online',this.solved);
    }
  }

  finish(){
    if(this.solved)return false;
    this.solve({rotations:[...this.rotations]});
    this.render();
    return true;
  }

  reset(){
    super.reset();
    this.rotations=[...INITIAL_ROTATIONS];
    this.started=true;
    this.render();
    return true;
  }

  destroy(){
    this.root.classList.remove('wiring-stage');
    super.destroy();
  }
}

export async function createWiringPuzzle(options){
  return new WiringPuzzle(options).mount();
}
