import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {wiringAssets} from './assets.js';

export class WiringPuzzle extends PuzzleCore {
  constructor({root,assets=wiringAssets,debugHitAreas=false}={}){
    super({id:'wiring',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز التوصيلات الكهربائية',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    return this;
  }

  reset(){
    super.reset();
    // Piece states and hit areas will be wired to the supplied original assets.
    return true;
  }
}

export async function createWiringPuzzle(options){
  return new WiringPuzzle(options).mount();
}
