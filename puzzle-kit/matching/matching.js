import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {matchingAssets} from './assets.js';

export class MatchingPuzzle extends PuzzleCore {
  constructor({root,assets=matchingAssets,debugHitAreas=false}={}){
    super({id:'matching',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز مطابقة التوصيلات',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    return this;
  }
}

export async function createMatchingPuzzle(options){
  return new MatchingPuzzle(options).mount();
}
