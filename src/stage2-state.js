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
    elevatorReady:false,
    elevator:null,
    floors:Array.from({length:FLOOR_COUNT+1},(_,i)=>i===0?null:{unlocked:i===1,complete:false})
  };
}

export function completeFloor(progress,floor=progress.currentFloor){
  if(floor<1||floor>FLOOR_COUNT)return false;
  const state=progress.floors[floor];
  if(state.complete)return false;
  state.complete=true;
  if(floor===progress.currentFloor&&floor<FLOOR_COUNT)progress.elevatorReady=true;
  return true;
}

export function canUseElevator(progress){
  return progress.mode==='floor'&&progress.currentFloor<FLOOR_COUNT&&progress.floors[progress.currentFloor].complete&&progress.elevatorReady;
}

export function beginElevator(progress){
  if(!canUseElevator(progress))return false;
  const from=progress.currentFloor,to=from+1;
  progress.mode='elevator';
  progress.elevatorReady=false;
  progress.elevator={from,to,progress:0};
  return true;
}

export function updateElevator(progress,amount){
  if(progress.mode!=='elevator'||!progress.elevator)return false;
  progress.elevator.progress=Math.max(0,Math.min(1,amount));
  if(progress.elevator.progress<1)return false;
  const {to}=progress.elevator;
  progress.currentFloor=to;
  progress.floors[to].unlocked=true;
  progress.elevator=null;
  progress.mode='floor';
  progress.elevatorReady=progress.floors[to].complete&&to<FLOOR_COUNT;
  return true;
}
