export const FLOOR_COUNT=6;

export const FLOOR_DEFS=Object.freeze([
  null,
  {id:1,type:'combat',title:'الاستقبال الأمني',enemies:['city','city']},
  {id:2,type:'puzzle',puzzle:'match',title:'شبكة المطابقة'},
  {id:3,type:'combat',title:'منطقة الآلات',enemies:['city','sniper']},
  {id:4,type:'puzzle',puzzle:'wiring',title:'غرفة الطاقة'},
  {id:5,type:'combat',title:'مختبر الأبحاث',enemies:['heavy','city','sniper']},
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

export const MATCH_SYMBOLS=Object.freeze(['hex','bolt','tri']);
export function isMatchSolved(connections){
  return MATCH_SYMBOLS.every(symbol=>connections[symbol]===symbol);
}

const DIRS=['U','R','D','L'];
const OPP={U:'D',R:'L',D:'U',L:'R'};
const STEP={U:[0,-1],R:[1,0],D:[0,1],L:[-1,0]};
const BASE={straight:['L','R'],elbow:['U','R'],tee:['L','U','R'],cross:['U','R','D','L'],blank:[]};
export const WIRING_TEMPLATE=Object.freeze([
  {type:'elbow',r:1},{type:'straight',r:1},{type:'elbow',r:3},
  {type:'straight',r:0},{type:'cross',r:0},{type:'elbow',r:2},
  {type:'elbow',r:2},{type:'straight',r:0},{type:'straight',r:0}
]);
export const WIRING_INITIAL=Object.freeze([0,0,1,0,0,0,1,1,1]);

function rotateDir(dir,r){return DIRS[(DIRS.indexOf(dir)+r)%4];}
export function tilePorts(tile,rotation){
  return BASE[tile.type].map(d=>rotateDir(d,rotation%4));
}
export function isWiringSolved(rotations){
  if(!Array.isArray(rotations)||rotations.length!==9)return false;
  const q=[[0,0]],seen=new Set(['0,0']);
  const portsAt=(x,y)=>tilePorts(WIRING_TEMPLATE[y*3+x],rotations[y*3+x]??0);
  if(!portsAt(0,0).includes('L'))return false;
  while(q.length){
    const [x,y]=q.shift(),ports=portsAt(x,y);
    if(x===2&&y===2&&ports.includes('R'))return true;
    for(const d of ports){
      const [dx,dy]=STEP[d],nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=3||ny>=3)continue;
      if(!portsAt(nx,ny).includes(OPP[d]))continue;
      const key=`${nx},${ny}`;
      if(!seen.has(key)){seen.add(key);q.push([nx,ny]);}
    }
  }
  return false;
}

export const CUBE_SOLUTION=Object.freeze(['start','right','down','lock','junction','down2','straight','right2','goal']);
export const CUBE_INITIAL=Object.freeze(['right','down2','start','lock','junction','right2','straight','down','goal']);
export function isCubeSolved(order){
  return Array.isArray(order)&&order.length===CUBE_SOLUTION.length&&order.every((v,i)=>v===CUBE_SOLUTION[i]);
}
