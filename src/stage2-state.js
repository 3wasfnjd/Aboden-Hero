export const FLOOR_COUNT=6;

export const FLOOR_DEFS=Object.freeze([
  null,
  {id:1,type:'combat',title:'قطاع المعالجة',enemies:['drone','drone']},
  {id:2,type:'puzzle',puzzle:'wiring',title:'غرفة الطاقة'},
  {id:3,type:'combat',title:'منطقة الآلات',enemies:['newguard','newguard']},
  {id:4,type:'puzzle',puzzle:'match',title:'غرفة التوصيل'},
  {id:5,type:'combat',title:'مختبر الأبحاث',enemies:['drone','drone']},
  {id:6,type:'puzzle',puzzle:'cubes',title:'غرفة التحكم'}
]);

export function createProgress(){
  return {
    currentFloor:1,
    mode:'floor',
    floors:Array.from({length:FLOOR_COUNT+1},(_,i)=>i===0?null:{unlocked:i===1,complete:false})
  };
}

export function reachFloor(progress,floor){
  if(floor<1||floor>FLOOR_COUNT)return false;
  progress.currentFloor=floor;
  progress.mode='floor';
  progress.floors[floor].unlocked=true;
  return true;
}

export function completeFloor(progress,floor=progress.currentFloor){
  if(floor<1||floor>FLOOR_COUNT)return false;
  const state=progress.floors[floor];
  if(state.complete)return false;
  state.complete=true;
  return true;
}
