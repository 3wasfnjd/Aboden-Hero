import {AssetStage,forwardAssetError} from '../core/asset-stage.js';

export async function createAssetBackedPuzzle({puzzle,root,baseAsset,alt='',fit='contain',allowUpscale=false,debugHitAreas=false}){
  if(!baseAsset){
    const empty=document.createElement('div');
    empty.className='puzzle-empty';
    empty.textContent='الأصول الأصلية لهذا اللغز لم تُضف بعد.';
    root.replaceChildren(empty);
    return {puzzle,stage:null};
  }
  const stage=new AssetStage({root,fit,allowUpscale,debugHitAreas});
  try{
    const meta=await stage.load(baseAsset,{alt});
    puzzle.emit('puzzle:ready',{asset:meta});
  }catch(error){
    forwardAssetError(puzzle,error);
    throw error;
  }
  return {puzzle,stage};
}
