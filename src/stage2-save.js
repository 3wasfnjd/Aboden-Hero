export const STAGE2_SAVE_KEY='aboden-hero-stage2-checkpoint-v1';
export const STAGE2_SAVE_VERSION=1;

export function normalizeCheckpointFloor(value,floorCount=6){
  const floor=Number(value);
  return Number.isInteger(floor)&&floor>=1&&floor<=floorCount?floor:0;
}

export function loadCheckpointFloor(floorCount=6,storage=globalThis.localStorage,key=STAGE2_SAVE_KEY){
  try{
    const raw=storage?.getItem?.(key);
    if(!raw)return 0;
    const saved=JSON.parse(raw);
    if(saved?.version!==STAGE2_SAVE_VERSION)return 0;
    return normalizeCheckpointFloor(saved.floor,floorCount);
  }catch{
    return 0;
  }
}

export function saveCheckpointFloor(floor,floorCount=6,storage=globalThis.localStorage,key=STAGE2_SAVE_KEY){
  const safeFloor=normalizeCheckpointFloor(floor,floorCount);
  if(!safeFloor)return false;
  try{
    storage?.setItem?.(key,JSON.stringify({version:STAGE2_SAVE_VERSION,floor:safeFloor}));
    return true;
  }catch{
    return false;
  }
}

export function clearCheckpointFloor(storage=globalThis.localStorage,key=STAGE2_SAVE_KEY){
  try{
    storage?.removeItem?.(key);
    return true;
  }catch{
    return false;
  }
}

export function restoreProgressFromCheckpoint(progress,floor,floorCount=6){
  const safeFloor=normalizeCheckpointFloor(floor,floorCount);
  if(!safeFloor||!progress)return 0;
  progress.currentFloor=safeFloor;
  progress.mode='floor';
  progress.elevatorReady=false;
  progress.elevator=null;
  for(let index=1;index<=floorCount;index++){
    const state=progress.floors?.[index];
    if(!state)continue;
    state.unlocked=index<=safeFloor;
    state.complete=index<safeFloor;
  }
  return safeFloor;
}
