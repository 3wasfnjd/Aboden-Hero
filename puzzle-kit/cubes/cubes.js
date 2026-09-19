import {PuzzleCore} from '../core/puzzle-core.js';
import {createAssetBackedPuzzle} from '../shared/create-puzzle.js';
import {cubeAssets} from './assets.js';

export class CubesPuzzle extends PuzzleCore {
  constructor({root,assets=cubeAssets,debugHitAreas=false}={}){
    super({id:'cubes',root,assets});
    this.debugHitAreas=debugHitAreas;
    this.stage=null;
  }

  async mount(){
    const {stage}=await createAssetBackedPuzzle({
      puzzle:this,root:this.root,baseAsset:this.assets.base,
      alt:'لوحة لغز ترتيب المكعبات',
      debugHitAreas:this.debugHitAreas
    });
    this.stage=stage;
    return this;
  }
}

export async function createCubesPuzzle(options){
  return new CubesPuzzle(options).mount();
}
